import { useNavigate } from "react-router-dom";
import Button from "../components/global/Button";
import Icon from "../components/global/Icon";
import splashImg from "../assets/pages/onboarding/splash.png";

export default function SplashScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col bg-canopy-700 text-sand-50 px-6 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="max-w-md mx-auto w-full flex flex-col items-center text-center flex-1">
        <div className="flex items-center gap-2 mt-4">
          <span className="h-9 w-9 rounded-2xl bg-sand-50 text-canopy-700 flex items-center justify-center">
            <Icon name="leaf" size={20} />
          </span>
          <span className="font-display font-bold text-2xl tracking-wide">SVARGA</span>
        </div>
        <p className="mt-3 text-sand-100/90 text-sm">Sehat. Nyaman. Terhubung.</p>

        <img
          src={splashImg}
          alt="Ilustrasi koridor hijau Banyuwangi"
          className="w-full rounded-[1.75rem] mt-8 object-cover"
        />
      </div>

      <div className="max-w-md mx-auto w-full flex flex-col items-center gap-3">
        <Button
          onClick={() => navigate("/onboarding")}
          variant="subtle"
          size="lg"
          className="w-full !bg-sand-50 !text-canopy-700 font-semibold"
        >
          Mulai
        </Button>
        <button onClick={() => navigate("/home")} className="text-sm text-sand-50/90 underline underline-offset-2">
          Lewati
        </button>
      </div>
    </div>
  );
}
