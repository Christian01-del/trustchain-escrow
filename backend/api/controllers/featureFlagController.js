import {
  listFlags,
  createFlag,
  updateFlag,
  deleteFlag,
  listFlagsForTenant,
  setTenantFlagOverride,
  removeTenantFlagOverride,
} from '../../services/featureFlags.js';

const FLAG_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

function validateFlagKey(key) {
  if (typeof key !== 'string' || !FLAG_KEY_PATTERN.test(key)) {
    return 'Flag key must be 1-64 chars of lowercase letters, digits, dot, underscore or hyphen, starting with a letter or digit.';
  }
  return null;
}

function validateTenantId(tenantId) {
  if (typeof tenantId !== 'string' || !TENANT_ID_PATTERN.test(tenantId)) {
    return 'Tenant id must be 1-64 chars of letters, digits, dot, underscore or hyphen, starting with a letter or digit.';
  }
  return null;
}

function validateFlagBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.';
  }
  if (body.isEnabled !== undefined && typeof body.isEnabled !== 'boolean') {
    return 'isEnabled must be a boolean.';
  }
  if (body.rolloutPercentage !== undefined) {
    const pct = body.rolloutPercentage;
    if (typeof pct !== 'number' || !Number.isFinite(pct) || pct < 0 || pct > 100) {
      return 'rolloutPercentage must be a number between 0 and 100.';
    }
  }
  if (body.isEnabled === false && typeof body.rolloutPercentage === 'number' && body.rolloutPercentage > 0) {
    return 'Contradictory settings: rolloutPercentage must be 0 when isEnabled is false.';
  }
  return null;
}

export async function index(_req, res) {
  const flags = await listFlags();
  res.json({ data: flags });
}

export async function create(req, res) {
  const keyError = validateFlagKey(req.body?.key);
  if (keyError) return res.status(400).json({ error: { code: 'INVALID_BODY', message: keyError } });
  const bodyError = validateFlagBody(req.body);
  if (bodyError) return res.status(400).json({ error: { code: 'INVALID_BODY', message: bodyError } });

  try {
    const flag = await createFlag(req.body, req.headers['x-admin-api-key']);
    res.status(201).json({ data: flag });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Flag key already exists.' });
    res.status(400).json({ error: err.message });
  }
}

export async function update(req, res) {
  const keyError = validateFlagKey(req.params.key);
  if (keyError) return res.status(400).json({ error: { code: 'INVALID_BODY', message: keyError } });
  const bodyError = validateFlagBody(req.body);
  if (bodyError) return res.status(400).json({ error: { code: 'INVALID_BODY', message: bodyError } });

  try {
    const flag = await updateFlag(req.params.key, req.body, req.headers['x-admin-api-key']);
    res.json({ data: flag });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Flag not found.' });
    res.status(400).json({ error: err.message });
  }
}

export async function destroy(req, res) {
  const keyError = validateFlagKey(req.params.key);
  if (keyError) return res.status(400).json({ error: { code: 'INVALID_BODY', message: keyError } });

  try {
    await deleteFlag(req.params.key, req.headers['x-admin-api-key']);
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Flag not found.' });
    res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/admin/feature-flags/tenants/:tenantId
 * List all flags for a specific tenant, merged with global flag values.
 */
export async function listForTenant(req, res) {
  try {
    const { tenantId } = req.params;
    const tenantError = validateTenantId(tenantId);
    if (tenantError) return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: tenantError } });

    const flags = await listFlagsForTenant(tenantId);
    res.json({ data: flags });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

/**
 * PUT /api/admin/feature-flags/:key/tenants/:tenantId
 * Set a tenant-level override for a feature flag.
 * Body: { isEnabled: boolean }
 */
export async function setTenantOverride(req, res) {
  try {
    const { key, tenantId } = req.params;
    const { isEnabled } = req.body ?? {};

    const keyError = validateFlagKey(key);
    if (keyError) return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: keyError } });
    const tenantError = validateTenantId(tenantId);
    if (tenantError) return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: tenantError } });

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'isEnabled must be a boolean' } });
    }

    await setTenantFlagOverride(key, tenantId, isEnabled, req.headers['x-admin-api-key']);
    res.json({ ok: true, flagKey: key, tenantId, isEnabled });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

/**
 * DELETE /api/admin/feature-flags/:key/tenants/:tenantId
 * Remove a tenant-level override, reverting to global flag behaviour.
 */
export async function removeTenantOverride(req, res) {
  try {
    const { key, tenantId } = req.params;

    const keyError = validateFlagKey(key);
    if (keyError) return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: keyError } });
    const tenantError = validateTenantId(tenantId);
    if (tenantError) return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: tenantError } });

    await removeTenantFlagOverride(key, tenantId, req.headers['x-admin-api-key']);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}
