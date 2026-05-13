function requireAdminKey(request) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return { ok: false, response: Response.json(
      { error: "Server misconfiguration: ADMIN_API_KEY is not set" },
      { status: 500 },
    ) };
  }
  const provided = request.headers.get("x-admin-api-key");
  if (!provided || provided !== expected) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}

export { requireAdminKey };
