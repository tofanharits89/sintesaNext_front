// Deprecated: use /api/v1/auth/logout instead. Kept temporarily for backward compatibility.
export { POST } from "../../v1/auth/logout/route";
    const tj = await t.json().catch(() => ({} as any));
    csrfToken = tj?.data?.csrfToken || tj?.csrfToken;
  } catch {}

  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers: {
      ...(incomingCookie ? { cookie: incomingCookie } : {}),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await resp.json().catch(() => ({ ok: resp.ok }));
  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });
  forwardSetCookies(resp, res);
  return res;
}
