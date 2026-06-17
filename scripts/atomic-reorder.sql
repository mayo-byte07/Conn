-- ═══════════════════════════════════════════════════════════
-- CONN — Atomic Reorder Functions
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════
-- These functions eliminate race conditions in display_order
-- reordering by wrapping delete + reorder in a single atomic
-- PostgreSQL transaction. Solves Issue #89.
-- ═══════════════════════════════════════════════════════════

-- 1. Delete single link + reorder remaining links atomically
CREATE OR REPLACE FUNCTION delete_link_and_reorder(
  p_link_id UUID,
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_links WHERE id = p_link_id AND user_id = p_user_id;

  WITH reordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order ASC) - 1 AS new_order
    FROM user_links
    WHERE user_id = p_user_id
  )
  UPDATE user_links u
  SET display_order = r.new_order
  FROM reordered r
  WHERE u.id = r.id;
END;
$$;


-- 2. Delete multiple links + reorder remaining links atomically
CREATE OR REPLACE FUNCTION delete_links_bulk_and_reorder(
  p_link_ids UUID[],
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_links WHERE id = ANY(p_link_ids) AND user_id = p_user_id;

  WITH reordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order ASC) - 1 AS new_order
    FROM user_links
    WHERE user_id = p_user_id
  )
  UPDATE user_links u
  SET display_order = r.new_order
  FROM reordered r
  WHERE u.id = r.id;
END;
$$;


-- 3. Delete category + reorder remaining categories atomically
CREATE OR REPLACE FUNCTION delete_category_and_reorder(
  p_category_id UUID,
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Uncategorize links in this category
  UPDATE user_links SET category_id = NULL
  WHERE user_id = p_user_id AND category_id = p_category_id;

  -- Delete the category
  DELETE FROM link_categories WHERE id = p_category_id AND user_id = p_user_id;

  -- Reorder remaining categories
  WITH reordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY category_order ASC) - 1 AS new_order
    FROM link_categories
    WHERE user_id = p_user_id
  )
  UPDATE link_categories u
  SET category_order = r.new_order
  FROM reordered r
  WHERE u.id = r.id;
END;
$$;


-- 4. Reorder links atomically (client-specified order)
CREATE OR REPLACE FUNCTION reorder_links_by_ids(
  p_ordered_ids UUID[],
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_links u
  SET display_order = (r.new_order)::int
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY ordinality) - 1 AS new_order
    FROM UNNEST(p_ordered_ids) WITH ORDINALITY AS t(id, ordinality)
  ) r
  WHERE u.id = r.id AND u.user_id = p_user_id;
END;
$$;


-- 5. Reorder categories atomically (client-specified order)
CREATE OR REPLACE FUNCTION reorder_categories_by_ids(
  p_ordered_ids UUID[],
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE link_categories u
  SET category_order = (r.new_order)::int
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY ordinality) - 1 AS new_order
    FROM UNNEST(p_ordered_ids) WITH ORDINALITY AS t(id, ordinality)
  ) r
  WHERE u.id = r.id AND u.user_id = p_user_id;
END;
$$;


SELECT 'Atomic reorder functions created successfully!' AS status;
