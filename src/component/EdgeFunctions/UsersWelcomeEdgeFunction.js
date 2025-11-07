import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async (req)=>{
  try {
    // ✅ Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }
    // -------------------------
    // 0️⃣ Authorization Check
    // -------------------------
    const AUTH_HEADER = req.headers.get("Authorization");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env");
    if (AUTH_HEADER !== `Bearer ${SERVICE_ROLE_KEY}`) {
      return new Response(JSON.stringify({
        error: "Unauthorized. Invalid service role key."
      }), {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    // -------------------------
    // 1️⃣ Parse incoming store data
    // -------------------------
    const body = await req.json();
    console.log("📩 Incoming payload:", body);
    // Support both {record: {...}} and direct {...}
    const newStore = body.record || body;
    if (!newStore || !newStore.email_address) {
      throw new Error("No store data received");
    }
    const { full_name, email_address, shop_name, phone_number } = newStore;
    // -------------------------
    // 2️⃣ Send Welcome Email using Resend
    // -------------------------
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY in environment");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Sellytics <noreply@sellyticshq.com>",
        to: [
          email_address
        ],
        subject: `Welcome to Sellytics, ${full_name}!`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
           <h2 style="color: #2563eb;">Hey ${full_name}, welcome to Sellytics 🎉</h2>

        <p>Your store, <strong>${shop_name}</strong>, has been successfully created.</p>

        <p>We’re excited to have you with us! With Sellytics, you can:</p>

        <ul style="padding-left: 18px; line-height: 1.6;">
          <li>Track your store’s growth over time</li>
          <li>Monitor staff sales activity and performance</li>
          <li>Analyze your daily, weekly, and monthly sales data</li>
          <li>Make smarter decisions with real-time insights</li>
          <li>Perform monthly store Audit to track missing items and reconcile your goods</li>
        </ul>

          <p><strong>📞 Phone:</strong> ${phone_number || "Not provided"}</p>
          <br/>

            <a href="https://sellyticshq.com/login"
              style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
              Access Your Dashboard Here
            </a>
            <br/><br/>
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <p>Cheers,<br/>The Sellytics Team 🚀</p>

  <p style="margin-top: 10px;">
    <strong>Contact Us</strong><br/>
    <a href="mailto:hello@sellyticshq.com" style="color:#2563eb; text-decoration:none;">
      hello@sellyticshq.com
    </a>
  </p>

  <p style="margin-top: 10px;">
    <strong>WhatsApp:</strong><br/>
    <a href="https://wa.link/0gzm91" style="color:#2563eb; text-decoration:none;">
      Chat on WhatsApp
    </a>
  </p>

  <p style="margin-top: 10px;">
    <strong>Call Us:</strong><br/>
    <a href="tel:+2349167690043"
       style="display:inline-block; background:#2563eb; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none; font-size:14px;">
      📞 Call +234 916 769 0043
    </a>
  </p>

  <p style="margin-top: 10px;">
    <strong>Website:</strong><br/>
    <a href="https://www.sellyticshq.com" style="color:#2563eb; text-decoration:none;">
      www.sellyticshq.com
    </a><br/>
    <em style="color:#555;">Track Smartly.</em>
  </p>

  <hr style="margin:20px 0; border:0; border-top:1px solid #ddd;" />

  <p style="font-size:14px; margin-bottom:6px;"><strong>Follow Us</strong></p>
  <p style="font-size:13px; line-height:1.6;">
    Instagram:
    <a href="https://instagram.com/sellyticshq" style="color:#2563eb; text-decoration:none;">
      @sellyticshq
    </a><br/>

    TikTok:
    <a href="https://tiktok.com/@sellyticshq" style="color:#2563eb; text-decoration:none;">
      @sellyticshq
    </a><br/>

    LinkedIn:
    <a href="https://www.linkedin.com/company/sellyticshq" style="color:#2563eb; text-decoration:none;">
      SellyticsHQ
    </a>
  </p>

  <hr style="margin:20px 0; border:0; border-top:1px solid #ddd;" />

  <p style="font-size:12px; color:#777; text-align:center;">
    © 2025 Sellytics. All rights reserved.
  </p>

</div>


        `
      })
    });
    // -------------------------
    // 3️⃣ Send Slack Notification
    // -------------------------
    const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL");
    if (SLACK_WEBHOOK_URL) {
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: `🆕 *New Store Registered!*\n• *Shop:* ${shop_name}\n• *Owner:* ${full_name}\n• *Email:* ${email_address}\n• *Phone:* ${phone_number || "No phone provided"}\n🎉`
        })
      });
    }
    // -------------------------
    // 4️⃣ Success Response
    // -------------------------
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
