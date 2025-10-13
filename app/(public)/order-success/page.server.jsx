// app/(public)/order-success/page.server.jsx
import OrderSuccessClient from "./OrderSuccessClient"; // we'll create this next

export default function OrderSuccessPage({ searchParams }) {
  // read query param on server side (works during prerender/build)
  const orderId = Array.isArray(searchParams?.orderId) ? searchParams.orderId[0] : (searchParams?.orderId ?? null);

  // render a lightweight server HTML shell and mount client behavior separately
  // If you don't want any client JS at all, you can render full markup here using `orderId`.
  return (
    <div>
      {/* Basic server-rendered confirmation — visible to crawlers & build */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ maxWidth: 720, width: "100%", padding: 24, borderRadius: 12, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>Order Confirmed</h1>
          <p style={{ color: "#6b7280" }}>Thanks — your order was placed.</p>
          {orderId && (
            <p style={{ fontFamily: "monospace", background: "#f8fafc", padding: 8, borderRadius: 6 }}>{orderId}</p>
          )}
          {/* Client interactivity mounted below */}
          <OrderSuccessClient serverOrderId={orderId} />
        </div>
      </div>
    </div>
  );
}
