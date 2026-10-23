-- Up Migration
CREATE OR REPLACE FUNCTION check_household_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE hid uuid;
BEGIN
 IF TG_TABLE_NAME='households' THEN hid := NEW.id;
 ELSIF TG_OP='DELETE' THEN hid := OLD.household_id;
 ELSE hid := NEW.household_id;
 END IF;
 IF EXISTS(SELECT 1 FROM households WHERE id=hid AND deleted_at IS NULL)
 AND (SELECT count(*) FROM household_members WHERE household_id=hid AND role='owner' AND status='active')<>1
 THEN RAISE EXCEPTION 'Active household requires exactly one owner' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
-- Down Migration
-- Forward-only.
