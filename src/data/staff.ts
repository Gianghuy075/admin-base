export interface StaffItem {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: "Admin" | "Manager" | "Staff";
  isActive: boolean;
  createdAt: string;
}

export const seedStaff: StaffItem[] = [
  {
    id: "staff-admin",
    name: "Quản trị viên",
    username: "admin",
    password: "admjnad123",
    role: "Admin",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "staff-1",
    name: "Nguyễn Văn A (Quản lý)",
    username: "manager1",
    password: "manager123",
    role: "Manager",
    isActive: true,
    createdAt: "2026-05-10T14:32:00.000Z",
  },
  {
    id: "staff-2",
    name: "Trần Thị B (Thu ngân)",
    username: "staff1",
    password: "staff123",
    role: "Staff",
    isActive: true,
    createdAt: "2026-05-15T08:15:30.000Z",
  },
  {
    id: "staff-3",
    name: "Lê Văn C (Nhân viên kho)",
    username: "staff2",
    password: "staff123",
    role: "Staff",
    isActive: false,
    createdAt: "2026-05-20T17:45:00.000Z",
  },
];
