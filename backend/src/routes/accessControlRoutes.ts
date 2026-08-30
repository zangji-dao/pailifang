import { Router } from 'express';
import { accessControlController } from '../controllers/accessControlController';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/organizations', requirePermission('membership.manage', 'delegation.manage'), accessControlController.organizations);
router.post('/organizations', requirePermission('platform.manage'), accessControlController.createOrganization);
router.get('/roles', requirePermission('membership.manage'), accessControlController.roles);
router.get('/members', requirePermission('membership.manage'), accessControlController.members);
router.post('/members', requirePermission('membership.manage'), accessControlController.saveMember);
router.patch('/members/:id', requirePermission('membership.manage'), accessControlController.updateMember);
router.get('/invitations', requirePermission('membership.manage'), accessControlController.invitations);
router.post('/invitations', requirePermission('membership.manage'), accessControlController.createInvitation);
router.post('/invitations/:id/revoke', requirePermission('membership.manage'), accessControlController.revokeInvitation);
router.post('/invitations/:id/regenerate', requirePermission('membership.manage'), accessControlController.regenerateInvitation);
router.get('/engagements', requirePermission('delegation.manage'), accessControlController.engagements);
router.post('/engagements', requirePermission('delegation.manage'), accessControlController.saveEngagement);

export default router;
