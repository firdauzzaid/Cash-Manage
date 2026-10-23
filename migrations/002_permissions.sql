-- Up Migration
ALTER TABLE profiles ADD CONSTRAINT profiles_auth_user_fk FOREIGN KEY(auth_user_id) REFERENCES auth_users(id) ON DELETE SET NULL;
GRANT SELECT,INSERT,UPDATE,DELETE ON auth_users,auth_sessions,auth_accounts,auth_verifications,auth_rate_limits TO cashflow_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON profiles,households,household_members,household_invitations,financial_accounts,categories,transactions,budgets,mutation_requests,deletion_requests TO cashflow_app;
GRANT SELECT,INSERT ON audit_events TO cashflow_app;
GRANT SELECT ON account_effects TO cashflow_app;
-- Down Migration
-- Forward-only.
