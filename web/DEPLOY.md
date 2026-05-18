# Deploying the LifeVine Admin Portal to Vercel

This is a Next.js 16 App Router app authenticated against the same Supabase project the mobile app uses (`ikiwhhuxodegpwuuqblz`). Deployment to Vercel takes about 5 minutes.

## One-time setup

### 1. Push to a Git remote

Vercel deploys from Git. Push this `web/` directory (or the whole repo) to GitHub/GitLab/Bitbucket.

### 2. Import on Vercel

- Go to <https://vercel.com/new>
- Select your repo
- **Root Directory**: set to `web` (since the Next app is in a subdirectory)
- Framework Preset: Next.js (auto-detected)
- Leave build/install commands at defaults

### 3. Add environment variables

In the Vercel project's **Settings → Environment Variables**, add (for **Production**, **Preview**, and **Development**):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ikiwhhuxodegpwuuqblz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (the anon JWT from `.env.local`) |

Do **not** add the `service_role` key anywhere.

### 4. Whitelist the Vercel URL in Supabase Auth

After the first deploy you'll have a URL like `https://lifevine-admin-xyz.vercel.app`. In the Supabase dashboard:

- **Authentication → URL Configuration**
- **Site URL**: set to your production Vercel URL
- **Redirect URLs**: add both the production URL and `https://*.vercel.app` (so preview deploys work)

Without this, password resets and email confirmations will be rejected as untrusted redirects.

### 5. Create the audit log function in Supabase

In Supabase SQL editor, run once:

```sql
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_action text, p_entity_type text, p_entity_id uuid, p_payload jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_log(actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_payload);
END;
$$;
```

This is required for approve/reject actions to log audit trail entries.

## What happens on every push

- Push to `main` → production deploy at your primary URL
- Push to any other branch → preview deploy on its own URL
- Pull request → preview deploy auto-comments on the PR

## Custom domain

Free on Vercel: **Settings → Domains → Add**. Point your DNS A/CNAME there. Don't forget to add the new domain to Supabase Auth's Site URL / Redirect URLs.

## Cost

Free Hobby tier limits (more than enough for beta):
- 100 GB bandwidth/month
- 100k Server Function invocations/day
- Unlimited deployments

If you outgrow it, Pro is $20/user/mo.
