/*
# Disable public signup, allow admin-created users only

## Summary
Blocca la registrazione pubblica su Supabase Auth. Dopo che il primo account
amministratore è stato creato, nessun altro utente può auto-registrarsi via
supabase.auth.signUp(). La creazione di nuovi amministratori è permessa solo
attraverso l'edge function admin-users, che usa la service role e marca il
nuovo utente con app_metadata.created_by_admin = true.

## Security
- Trigger BEFORE INSERT su auth.users: rifiuta l'inserimento se:
  - non esiste ancora nessun utente (bootstrap del primo admin), OPPURE
  - il nuovo utente ha app_metadata.created_by_admin = true (creato via admin)
- In tutti gli altri casi, solleva un'eccezione che blocca la signup pubblica.

## Notes
1. Il primo admin (già creato) resta inalterato: il trigger si applica solo a nuovi INSERT.
2. Il flag `created_by_admin` è immutabile lato client (vive in raw_app_meta_data,
   non raw_user_meta_data), quindi non può essere spoofato da una signUp pubblica.
3. Funzione SECURITY DEFINER di un superuser per poter leggere auth.users durante il check.
4. Idempotente: DROP IF EXISTS prima di ricreare trigger e funzione.
*/

-- Assicuriamoci che la funzione sia eseguita con privilegi sufficienti per leggere auth.users
DROP TRIGGER IF EXISTS block_public_signup_trigger ON auth.users;
DROP FUNCTION IF EXISTS block_public_signup();

CREATE OR REPLACE FUNCTION block_public_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, pg_catalog
AS $$
DECLARE
  user_count integer;
BEGIN
  -- Se il nuovo utente è stato creato dall'admin (flag in app_metadata), permetti
  IF NEW.raw_app_meta_data ? 'created_by_admin' THEN
    RETURN NEW;
  END IF;

  -- Bootstrap: se non esiste ancora nessun utente, permetti il primo admin
  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count = 0 THEN
    RETURN NEW;
  END IF;

  -- Altrimenti blocca la signup pubblica
  RAISE EXCEPTION 'Public signup is disabled. Ask an administrator to create your account.'
    USING ERRCODE = 'check_violation';

  RETURN NEW;
END;
$$;

CREATE TRIGGER block_public_signup_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION block_public_signup();
