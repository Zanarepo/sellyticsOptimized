import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import jsPDF from "https://esm.sh/jspdf";
import autoTable from "https://esm.sh/jspdf-autotable";
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) throw new Error("Missing environment variables");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: groups } = await supabase.from("sale_groups").select(`
      id,
      total_amount,
      payment_method,
      email_receipt,
      created_at,
      customer:customer_id(fullname, email, phone_number, address),
      store:store_id(shop_name, email_address, phone_number, full_name),
      dynamic_sales:dynamic_sales(*, dynamic_product(id, name))
    `).is("sent_email_at", null).eq("email_receipt", true);
    if (!groups?.length) return send({
      status: "no pending receipts"
    });
    for (const group of groups){
      if (!group.customer?.email) continue;
      const salesRows = group.dynamic_sales.map((sale)=>[
          sale.dynamic_product.name,
          sale.device_id ?? "-",
          sale.quantity ?? 1,
          `₦${Number(sale.amount ?? 0).toFixed(2)}`,
          `₦${((sale.quantity ?? 1) * (sale.amount ?? 0)).toFixed(2)}`
        ]);
      const totalAmount = group.dynamic_sales.reduce((sum, s)=>sum + (s.amount ?? 0) * (s.quantity ?? 1), 0);
      // --- Generate PDF ---
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(group.store?.shop_name ?? "Store", 105, 15, {
        align: "center"
      });
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(group.created_at).toLocaleString()}`, 10, 25);
      doc.text(`Receipt ID: RCPT-${group.id}-${Date.now()}`, 10, 32);
      doc.text(`Customer: ${group.customer.fullname}`, 10, 42);
      doc.text(`Phone: ${group.customer.phone_number ?? "N/A"}`, 10, 49);
      doc.text(`Address: ${group.customer.address ?? "N/A"}`, 10, 56);
      // Table
      autoTable(doc, {
        startY: 65,
        head: [
          [
            "Product",
            "Device ID",
            "Qty",
            "Unit Price",
            "Amount"
          ]
        ],
        body: salesRows,
        styles: {
          cellPadding: 3,
          fontSize: 10
        },
        headStyles: {
          fillColor: [
            37,
            99,
            235
          ],
          textColor: 255,
          halign: "center"
        }
      });
      // Total & payment
      doc.text(`Total: ₦${totalAmount.toFixed(2)}`, 160, doc.lastAutoTable.finalY + 10, {
        align: "right"
      });
      doc.text(`Payment Method: ${group.payment_method}`, 10, doc.lastAutoTable.finalY + 20);
      doc.text(`Store Contact: Email: ${group.store?.email_address ?? "N/A"} | Phone: ${group.store?.phone_number ?? "N/A"}`, 10, doc.lastAutoTable.finalY + 30);
      doc.text(`Warm regards,\n${group.store?.full_name ?? "Store Owner"}`, 10, doc.lastAutoTable.finalY + 40);
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      // --- Build HTML email ---
      const rowsHtml = group.dynamic_sales.map((sale)=>{
        const qty = sale.quantity ?? 1;
        const unitPrice = sale.amount ?? 0;
        const total = qty * unitPrice;
        return `<tr>
          <td>${sale.dynamic_product.name}</td>
          <td>${sale.device_id ?? "-"}</td>
          <td>${qty}</td>
          <td>₦${unitPrice.toFixed(2)}</td>
          <td>₦${total.toFixed(2)}</td>
        </tr>`;
      }).join("");
      const html = `
<div style="font-family:Arial,sans-serif; max-width:600px; margin:auto; padding:20px;">
  <h2 style="text-align:center; color:#2563eb;">${group.store?.shop_name ?? "Store"}</h2>
  <p>Hi <strong>${group.customer.fullname}</strong>,</p>
  <p>Thank you for shopping with us! We truly appreciate your patronage.</p>

  <p><strong>Date:</strong> ${new Date(group.created_at).toLocaleString()}</p>
  <p><strong>Receipt ID:</strong> RCPT-${group.id}-${Date.now()}</p>
  <p><strong>Customer:</strong> ${group.customer.fullname}<br/>
     <strong>Phone:</strong> ${group.customer.phone_number ?? "N/A"}<br/>
     <strong>Address:</strong> ${group.customer.address ?? "N/A"}</p>

  <table style="width:100%; border-collapse:collapse; margin-top:12px;">
    <thead>
      <tr style="background:#2563eb; color:white;">
        <th style="padding:8px;">Product</th>
        <th style="padding:8px;">Device ID</th>
        <th style="padding:8px;">Qty</th>
        <th style="padding:8px;">Unit Price</th>
        <th style="padding:8px; text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <h3 style="text-align:right; margin-top:20px;">Total: ₦${totalAmount.toFixed(2)}</h3>
  <p><strong>Payment Method:</strong> ${group.payment_method}</p>

  <hr style="margin:20px 0;" />
  <p><strong>Store Contact:</strong><br/>
     Email: ${group.store?.email_address ?? "N/A"}<br/>
     Phone: ${group.store?.phone_number ?? "N/A"}</p>

  <p style="margin-top:20px;">Warm regards,<br/><strong>${group.store?.full_name ?? "Store Owner"}</strong></p>

  <p style="text-align:center; margin-top:30px; color:#777;">
    Powered by <a href="https://www.sellyticshq.com" target="_blank">Sellytics</a>
  </p>
</div>
`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `"${group.store?.shop_name ?? "Store"}" <hello@sellyticshq.com>`,
          to: group.customer.email,
          subject: `Your Receipt - ${group.store?.shop_name ?? "Store"}`,
          html,
          attachments: [
            {
              filename: `receipt-${group.id}.pdf`,
              type: "application/pdf",
              content: pdfBase64
            }
          ]
        })
      });
      await supabase.from("sale_groups").update({
        sent_email_at: new Date().toISOString()
      }).eq("id", group.id);
    }
    return send({
      status: "ok"
    });
  } catch (err) {
    console.error(err);
    return send({
      error: err.message
    }, 500);
  }
});
function send(body, code = 200) {
  return new Response(JSON.stringify(body), {
    status: code,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  });
}
