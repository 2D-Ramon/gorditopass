type WhyIcon = "megaphone" | "bag" | "case" | "tag" | "star" | "dollar" | "chart";

function WhyIconMark({ name }: { name: WhyIcon }) {
  const common = {
    width: 34,
    height: 34,
    viewBox: "0 0 32 32",
    fill: "currentColor",
    "aria-hidden": true as const,
  };
  if (name === "megaphone") {
    return (
      <svg {...common}>
        <path
          fillRule="evenodd"
          d="M5 13.2h3.4L18 7.4v17.2l-9.6-5.8H5a1.6 1.6 0 0 1-1.6-1.6v-2.4A1.6 1.6 0 0 1 5 13.2Zm3.4 6.1.9 4.3h2.6l-.7-4.1-2.8-.2Zm13.6-7.4a5.4 5.4 0 0 1 0 8.2 1.15 1.15 0 1 0 1.4 1.8 7.7 7.7 0 0 0 0-11.8 1.15 1.15 0 1 0-1.4 1.8Z"
        />
      </svg>
    );
  }
  if (name === "tag") {
    return (
      <svg {...common}>
        <path d="M5.8 16.2 15.6 6.4h9.2v9.2L15 25.4 5.8 16.2Z" />
        <circle cx="20.4" cy="11" r="1.7" fill="var(--bg)" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg {...common}>
        <path d="m16 4.8 2.9 6.8 7.4.7-5.6 4.8 1.7 7.3L16 20.7 9.6 24.4l1.7-7.3L5.7 12.3l7.4-.7L16 4.8Z" />
      </svg>
    );
  }
  if (name === "dollar") {
    return (
      <svg {...common}>
        <text
          x="16"
          y="25"
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          fontFamily="inherit"
        >
          $
        </text>
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M6 22h5V12H6v10Zm7.5 0h5V7h-5v15ZM21 22h5V14h-5v8ZM4 25.5h24v2.2H4v-2.2Z" />
      </svg>
    );
  }
  if (name === "bag") {
    return (
      <svg {...common}>
        <path d="M11.2 9.4a4.8 4.8 0 0 1 9.6 0V11h2.8l-1.2 14a2 2 0 0 1-2 1.8H11.6a2 2 0 0 1-2-1.8L8.4 11h2.8V9.4Zm2.2 0V11h5.2V9.4a2.6 2.6 0 0 0-5.2 0Z" />
        <circle cx="16" cy="17.2" r="2.1" fill="var(--bg)" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        fillRule="evenodd"
        d="M9.2 8.2h13.6l3.2 4.6H6l3.2-4.6ZM6 14.2h20v10.2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V14.2Zm8.2 3.2h3.6v3.2h-3.6v-3.2Z"
      />
    </svg>
  );
}

export function WhyGordito({
  items,
}: {
  items: { icon: WhyIcon; title: string; body: string }[];
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Why Gordito
      </h2>
      <div
        className={`mt-8 grid gap-10 ${
          items.length > 3 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
        }`}
      >
        {items.map((item) => (
          <div key={item.title}>
            <div className="text-brand">
              <WhyIconMark name={item.icon} />
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
