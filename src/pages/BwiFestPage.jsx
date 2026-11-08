import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import Card from "../components/global/Card";
import Icon from "../components/global/Icon";
import Skeleton from "../components/global/Skeleton";
import { getBfestCalendar } from "../services/contentService";
import route1 from "../assets/pages/home/route1.png";
import route2 from "../assets/pages/home/route2.png";

const images = [route1, route2, route1];

export default function BwiFestPage() {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    getBfestCalendar().then(setEvents);
  }, []);

  return (
    <PageShell title="Kalender B-Fest">
      <p className="text-sm text-ink-500 -mt-1 mb-4">
        Agenda festival budaya & pariwisata Banyuwangi, terintegrasi dengan Smart Green Route.
      </p>
      <div className="flex flex-col gap-3">
        {!events && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        {events?.map((e, i) => (
          <Card key={e.id} className="overflow-hidden flex items-stretch gap-3 p-3">
            <img src={images[i % images.length]} alt={e.bfest_name} className="h-20 w-20 rounded-xl object-cover shrink-0" />
            <div className="min-w-0 flex flex-col justify-center">
              <p className="font-medium text-ink-900">{e.bfest_name}</p>
              <p className="text-xs text-ink-500 mt-1 flex items-center gap-1.5">
                <Icon name="calendar" size={12} />
                {new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1.5">
                <Icon name="pin" size={12} />
                {e.location_name}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
