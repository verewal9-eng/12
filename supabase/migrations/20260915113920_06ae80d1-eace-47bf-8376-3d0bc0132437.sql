REVOKE ALL ON FUNCTION public.spend_balance(numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_balance(numeric, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated, service_role;