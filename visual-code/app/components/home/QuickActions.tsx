"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Home,
  KeyRound,
  Users,
} from "lucide-react";

import Card from "@/components/ui/Card";

const actions = [
  {
    title: "Vendere",
    description: "Pilot ti accompagna nella vendita passo dopo passo.",
    href: "/dashboard/sell",
    icon: Home,
  },
  {
    title: "Affittare",
    description:
      "Gestisci documenti, contratto e inquilino in un unico posto.",
    href: "/dashboard/rent",
    icon: KeyRound,
  },
  {
    title: "Trova un professionista",
    description:
      "Geometri, notai, tecnici e agenti verificati.",
    href: "/professionals",
    icon: Users,
  },
];

export default function QuickActions() {
  return (
    <div className="mt-14 w-full">

      <p className="mb-10 text-center text-sm font-medium uppercase tracking-[0.28em] text-slate-400">

        Oppure scegli da dove iniziare

      </p>

      <div className="grid gap-7 md:grid-cols-3">

        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
            >
              <Card
                className="
                  group
                  h-full
                  rounded-[30px]
                  border
                  border-slate-200
                  bg-white
                  p-8
                  transition-all
                  duration-500
                  hover:-translate-y-2
                  hover:border-slate-300
                  hover:shadow-[0_30px_70px_rgba(15,23,42,.12)]
                "
              >

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 transition-all duration-300 group-hover:bg-blue-50">

                  <Icon
                    size={28}
                    className="text-slate-900 transition-all duration-300 group-hover:text-blue-600"
                  />

                </div>

                <h3 className="mt-8 text-2xl font-semibold text-slate-900">

                  {action.title}

                </h3>

                <p className="mt-4 leading-7 text-slate-500">

                  {action.description}

                </p>

                <div className="mt-10 flex items-center font-semibold text-blue-600">

                  Scopri

                  <ArrowUpRight
                    size={18}
                    className="ml-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />

                </div>

              </Card>
            </Link>
          );
        })}

      </div>

    </div>
  );
}