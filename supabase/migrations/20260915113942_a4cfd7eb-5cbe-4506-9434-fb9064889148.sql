REVOKE EXECUTE ON FUNCTION public.spend_balance(numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon;