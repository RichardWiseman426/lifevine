-- ─────────────────────────────────────────────────────────────────────────────
-- 013: Write policies for org contributors on event_occurrences + opportunity_steps
-- ─────────────────────────────────────────────────────────────────────────────

-- event_occurrences: org contributors can insert/update/delete occurrences
-- for events they manage (SELECT policy already exists separately)
CREATE POLICY "Org contributors can manage event occurrences"
    ON public.event_occurrences FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id
          AND public.is_org_member(e.org_id, 'contributor')
    ));

-- opportunity_steps: org contributors can manage steps for their opportunities
CREATE POLICY "Org contributors can manage opportunity steps"
    ON public.opportunity_steps FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.opportunities o
        WHERE o.id = opportunity_id
          AND public.is_org_member(o.org_id, 'contributor')
    ));
