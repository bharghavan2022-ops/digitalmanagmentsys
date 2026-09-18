"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SearchResults = {
  events: { id: string; title: string; category: string }[];
  certificates: { id: string; certificateNo: string }[];
  volunteers: { id: string; fullName: string; nssId: string }[];
};

const EMPTY: SearchResults = { events: [], certificates: [], volunteers: [] };

export function GlobalSearch({ eventHref }: { eventHref: (id: string) => string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const timeout = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) setResults(await response.json());
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults =
    results.events.length + results.certificates.length + results.volunteers.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <input
        type="search"
        placeholder="Search events, certificates..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-2 text-sm shadow-lg">
          {!hasResults && <p className="p-2 text-muted-foreground">No matches.</p>}
          {results.events.length > 0 && (
            <div className="mb-2">
              <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground">Events</p>
              {results.events.map((event) => (
                <Link
                  key={event.id}
                  href={eventHref(event.id)}
                  className="block rounded px-2 py-1 hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  {event.title} <span className="text-muted-foreground">- {event.category}</span>
                </Link>
              ))}
            </div>
          )}
          {results.certificates.length > 0 && (
            <div className="mb-2">
              <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground">Certificates</p>
              {results.certificates.map((cert) => (
                <Link
                  key={cert.id}
                  href="/certificates"
                  className="block rounded px-2 py-1 hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  {cert.certificateNo}
                </Link>
              ))}
            </div>
          )}
          {results.volunteers.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground">Volunteers</p>
              {results.volunteers.map((v) => (
                <Link
                  key={v.id}
                  href="/admin/volunteers"
                  className="block rounded px-2 py-1 hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  {v.fullName} <span className="text-muted-foreground">- {v.nssId}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
