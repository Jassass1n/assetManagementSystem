-- Create function to automatically log asset changes
CREATE OR REPLACE FUNCTION log_asset_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log updates
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      asset_id,
      action,
      old_values,
      new_values,
      performed_by
    ) VALUES (
      NEW.id,
      'updated',
      to_jsonb(OLD) - 'updated_at',
      to_jsonb(NEW) - 'updated_at',
      NEW.updated_by -- Assuming we add an updated_by field
    );
    RETURN NEW;
  END IF;
  
  -- Log deletions
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      asset_id,
      action,
      old_values,
      performed_by
    ) VALUES (
      OLD.id,
      'deleted',
      to_jsonb(OLD),
      OLD.updated_by -- Assuming we add an updated_by field
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for asset changes
DROP TRIGGER IF EXISTS asset_audit_trigger ON public.assets;
CREATE TRIGGER asset_audit_trigger
  AFTER UPDATE OR DELETE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION log_asset_changes();

-- Add updated_by field to assets table for better audit tracking
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);
