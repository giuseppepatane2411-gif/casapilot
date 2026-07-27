"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Home,
  KeyRound,
  Users,
} from "lucide-react";

const actions = [
  {
    title: "Vendere",
    description: "Vendi casa con Pilot passo dopo passo.",
    href: "/dashboard/sell",
    icon: Home,
  },
  {
    title: "Affittare",
    description: "Gestisci tutto in un unico spazio.",
    href: "/dashboard/rent",
    icon: KeyRound,
  },
  {
    title: "Professionisti",
    description: "Trova tecnici e consulenti verificati.",
    href: "/professionals",
    icon: Users,
  },
];

export default function QuickActions() {
  return (
    <section className="w-full">

      <div className="mb-8 text-center">

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">

          Scegli come iniziare

        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">

          Tutto parte da qui.

        </h2>

      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="
                group
                flex
                h-full
                flex-col
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-6
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-blue-200
                hover:shadow-xl
              "
            >

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 transition duration-300 group-hover:bg-blue-600">

                <Icon
                  size={30}
                  className="text-blue-600 transition duration-300 group-hover:text-white"
                />

              </div>

              <h3 className="mt-6 text-2xl font-semibold text-slate-900">

                {action.title}

              </h3>

              <p className="mt-3 flex-1 text-base leading-7 text-slate-500">

                {action.description}

              </p>

              <div className="mt-8 flex items-center font-semibold text-blue-600">

                Inizia

                <ArrowUpRight
                  size={18}
                  className="ml-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />

              </div>

            </Link>
          );
        })}

      </div>

    </section>
  );
}