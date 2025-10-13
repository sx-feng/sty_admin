import {request} from './request'
// ✅ 获取系统年化利率
export const getFinancialRate = () => request(0, '/api/admin/sysconfig/financial')

// ✅ 更新系统年化利率
export const updateFinancialRate = (rate) =>
  request(1, '/api/admin/sysconfig/financial/update', { rate }, true)


// ✅ 获取公告
export const getAnnouncement = () => request(0, '/api/admin/sysconfig/announcement')

// ✅ 更新公告
export const updateAnnouncement = (announcement) =>
  request(1, '/api/admin/sysconfig/announcement/update', { announcement },true)

// ✅ 生成邀请码
export const getInvitationCode = () => request(0, '/api/admin/invitationcode/get')

// ✅ 查询全部邀请码
export const getAllInvitationCodes = () => request(0, '/api/admin/invitationcode/find/all')
