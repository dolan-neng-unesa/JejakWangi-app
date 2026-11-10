import TopStatusBar from "./TopStatusBar";
import BottomNav from "./BottomNav";

export default function PageShell({
  title,
  showBack = false,
  sensorState = "neutral",
  lastUpdated,
  hideNav = false,
  children,
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      {title && (
        <TopStatusBar title={title} showBack={showBack} sensorState={sensorState} lastUpdated={lastUpdated} />
      )}
      <main className={`flex-1 mx-auto w-full max-w-md px-4 py-4 ${hideNav ? "" : "pb-24"}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
