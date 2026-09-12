-- The public worker-secret wrapper is SECURITY INVOKER and delegates to a
-- narrowly granted private implementation. The service role needs schema
-- visibility in addition to EXECUTE on that implementation.

grant usage on schema private to service_role;
