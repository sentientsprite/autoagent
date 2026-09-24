"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { cardBody, cardShell, cardTitle, mutedNote } from "@/lib/portal-hub-styles";

type LocationRow = {
  siteId: string;
  name: string;
  businessName?: string;
  city: string | null;
  region: string | null;
  postalCode?: string | null;
  websiteUrl: string | null;
  category?: string | null;
};

type LocationsPayload = {
  org: { id: string; name: string; slug?: string; plan: string };
  locationCap: number;
  locationCount: number;
  atCap: boolean;
  locations: LocationRow[];
  note?: string;
  error?: string;
  detail?: string;
};

export function LocationsClient(props: { orgId: string }) {
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [data, setData] = useState<LocationsPayload | null>(null);
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setData(null);
    setErrorDetail("");
    void (async () => {
      try {
        const res = await fetch(
          `/api/money-farm/locations?orgId=${encodeURIComponent(props.orgId)}`,
        );
        const json = (await res.json()) as LocationsPayload;
        if (cancelled) return;
        if (!res.ok) {
          setStatus("err");
          setErrorDetail(json.error ?? res.statusText);
          if (json.detail) setErrorDetail((prev) => `${prev}: ${json.detail}`);
          return;
        }
        setData(json);
        setStatus("ok");
      } catch (e) {
        if (!cancelled) {
          setStatus("err");
          setErrorDetail(String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.orgId]);

  if (status === "loading") {
    return <p style={{ marginTop: 8, color: "#64748b" }}>Loading locations…</p>;
  }

  if (status === "err") {
    return (
      <section style={cardShell(true)}>
        <h2 style={cardTitle}>Couldn't load locations</h2>
        <p style={cardBody}>
          {errorDetail || "Unknown error"}. Check that the org id is seeded locally, or try the
          fixture org from the instructions state.
        </p>
        <p style={mutedNote}>
          orgId <code style={{ fontSize: 11 }}>{props.orgId}</code>
        </p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const rows = data.locations ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={cardShell()}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: "#555",
            margin: 0,
          }}
        >
          Org
        </p>
        <h2 style={cardTitle}>{data.org.name}</h2>
        <p style={cardBody}>
          Plan <strong>{data.org.plan}</strong>
          {" · "}
          {data.locationCount} / {data.locationCap} locations
          {data.atCap ? " · at cap" : ""}
        </p>
        {data.note ? <p style={mutedNote}>{data.note}</p> : null}
      </section>

      {rows.length === 0 ? (
        <section style={cardShell(true)}>
          <h2 style={cardTitle}>No locations yet</h2>
          <p style={cardBody}>
            This org has zero sites under the location cap. Seed the Money Farm fixture or add sites
            in the DB to see them here.
          </p>
        </section>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              color: "#1e293b",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                <th style={th}>Name</th>
                <th style={th}>City</th>
                <th style={th}>Region</th>
                <th style={th}>Website</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((loc) => (
                <tr key={loc.siteId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={td}>{loc.businessName || loc.name}</td>
                  <td style={td}>{loc.city ?? "—"}</td>
                  <td style={td}>{loc.region ?? "—"}</td>
                  <td style={td}>
                    {loc.websiteUrl ? (
                      <a
                        href={loc.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#1e40af", textDecoration: "none" }}
                      >
                        {loc.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: CSSProperties = {
  padding: "10px 12px 10px 0",
  fontWeight: 600,
  color: "#64748b",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const td: CSSProperties = {
  padding: "12px 12px 12px 0",
  verticalAlign: "top",
};
