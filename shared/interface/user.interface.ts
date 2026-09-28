import { Role } from "./role.interface"

export interface IUser {
  id: number
  fullname: string
  email: string
  role: Role
  avatar: string | null
}
