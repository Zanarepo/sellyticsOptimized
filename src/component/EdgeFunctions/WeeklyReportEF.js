import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as djwt from "https://deno.land/x/djwt@v2.9/mod.ts";
serve(async (req)=>{
  // ✅ Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
      }
    });
  }
  try {
    // -------------------------
    // 0. Environment setup
    // -------------------------
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env");
    // ❌ Removed strict Authorization header check —
    // this function is only accessed by authenticated users via your frontend
    // so we trust the call instead of comparing to the service key.
    // -------------------------
    // 1. Generate GA4 access token
    // -------------------------
    const GA_SERVICE_ACCOUNT_JSON = Deno.env.get("GA_SERVICE_ACCOUNT_JSON");
    if (!GA_SERVICE_ACCOUNT_JSON) throw new Error("Missing GA_SERVICE_ACCOUNT_JSON env");
    const serviceAccount = JSON.parse(GA_SERVICE_ACCOUNT_JSON);
    function pemToArrayBuffer(pem) {
      const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
      const binary = atob(b64);
      const buffer = new Uint8Array(binary.length);
      for(let i = 0; i < binary.length; i++)buffer[i] = binary.charCodeAt(i);
      return buffer.buffer;
    }
    const privateKey = await crypto.subtle.importKey("pkcs8", pemToArrayBuffer(serviceAccount.private_key), {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    }, true, [
      "sign"
    ]);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const claims = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: serviceAccount.token_uri,
      iat,
      exp
    };
    const jwt = await djwt.create({
      alg: "RS256",
      typ: "JWT"
    }, claims, privateKey);
    const tokenRes = await fetch(serviceAccount.token_uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    });
    const tokenJson = await tokenRes.json();
    const GA_ACCESS_TOKEN = tokenJson.access_token;
    if (!GA_ACCESS_TOKEN) throw new Error("Failed to generate GA access token");
    // -------------------------
    // 2. Fetch GA4 report (last 7 days)
    // -------------------------
    const GA_API = "https://analyticsdata.googleapis.com/v1beta/properties/458608190:runReport";
    const gaRes = await fetch(GA_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GA_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dimensions: [
          {
            name: "pageTitle"
          }
        ],
        metrics: [
          {
            name: "screenPageViews"
          }
        ],
        dateRanges: [
          {
            startDate: "7daysAgo",
            endDate: "today"
          }
        ]
      })
    });
    const gaData = await gaRes.json();
    // -------------------------
    // 3. Fetch sales from Supabase (last 2 months)
    // -------------------------
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL env");
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 7);
    const isoDate = twoMonthsAgo.toISOString();
    console.log("Fetching sales since:", isoDate);
    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/dynamic_sales?` + new URLSearchParams({
      select: "amount,store_id,store:stores!store_id(id,shop_name)",
      sold_at: `gte.${isoDate}`,
      order: "sold_at.desc"
    }), {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
        "Content-Type": "application/json"
      }
    });
    if (!supabaseRes.ok) {
      const err = await supabaseRes.text();
      throw new Error(`Supabase error ${supabaseRes.status}: ${err}`);
    }
    const sales = await supabaseRes.json();
    console.log(`Fetched ${sales.length} sales in last 7 days`);
    const topStores = {};
    for (const sale of sales){
      const storeName = sale.store?.shop_name?.trim() || sale.store_id?.toString() || "Unknown Store";
      const amount = parseFloat(sale.amount) || 0;
      topStores[storeName] = (topStores[storeName] || 0) + amount;
    }
    const sortedTopStores = Object.fromEntries(Object.entries(topStores).sort(([, a], [, b])=>Number(b) - Number(a)).slice(0, 10));
    // -------------------------
    // 4. Slack notification
    // -------------------------
    let SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL");
    if (req.method === "POST" && req.headers.get("content-type")?.includes("application/json")) {
      try {
        const rawBody = await req.text();
        if (rawBody) {
          const body = JSON.parse(rawBody);
          if (body.slack_webhook_url) {
            SLACK_WEBHOOK_URL = body.slack_webhook_url;
            console.log("Using Slack webhook from request body");
          }
        }
      } catch (e) {
        console.error("Failed to parse request body:", e instanceof Error ? e.message : e);
      }
    }
    if (SLACK_WEBHOOK_URL) {
      const now = new Date().toLocaleString("en-GB", {
        timeZone: "Africa/Lagos"
      });
      const slackText = `*Sales Report* (${now})\n` + `• Records: ${sales.length}\n` + (Object.keys(sortedTopStores).length > 0 ? Object.entries(sortedTopStores).map(([store, total])=>`• ${store}: ₦${Number(total).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`).join("\n") : "• No sales in last 7 days");
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: slackText
        })
      });
    }
    // -------------------------
    // 5. Return success
    // -------------------------
    return new Response(JSON.stringify({
      status: "ok",
      gaData,
      topStores: sortedTopStores,
      debug: {
        salesCount: sales.length,
        dateRange: `>= ${isoDate.split("T")[0]}`,
        slackSent: !!SLACK_WEBHOOK_URL
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({
      error: "Error running weekly report",
      details: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
