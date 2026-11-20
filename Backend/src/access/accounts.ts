import type { Access, PayloadRequest } from 'payload'

type AuthContext = { req: Pick<PayloadRequest, 'user'> }

export const isAdministrator = ({ req }: AuthContext): boolean => req.user?.rolle === 'admin'

export const adminOrSelf: Access = ({ req }) =>
  isAdministrator({ req }) || (req.user ? { id: { equals: req.user.id } } : false)

export const adminWrites = {
  create: isAdministrator,
  update: isAdministrator,
  delete: isAdministrator,
}
