import { supabase } from "../lib/supabase";

/**
 * 관리자 회원 관리 — DB 함수(0004 마이그레이션)를 호출한다.
 * 관리자 여부 확인과 삭제는 모두 DB 함수 안에서 처리되므로 브라우저에 특별한 권한이 없다.
 */

export interface AdminUser {
  id: string;
  username: string | null;
  name: string;
  created_at: string;
  task_count: number;
  session_count: number;
  is_admin: boolean;
}

export interface AdminState {
  /** 0004 마이그레이션이 적용되어 있는지 */
  available: boolean;
  isAdmin: boolean;
  /** 관리자가 한 명이라도 등록되어 있는지 (없으면 첫 관리자 등록 버튼을 보여준다) */
  adminExists: boolean;
}

export async function getAdminState(): Promise<AdminState> {
  const [admin, exists] = await Promise.all([
    supabase.rpc("is_app_admin"),
    supabase.rpc("admin_exists"),
  ]);
  if (admin.error || exists.error) return { available: false, isAdmin: false, adminExists: false };
  return { available: true, isAdmin: admin.data === true, adminExists: exists.data === true };
}

export async function claimFirstAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("admin_claim_first");
  if (error) throw error;
  return data === true;
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

export async function clearUserData(userId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_clear_user_data", { p_user_id: userId });
  if (error) throw error;
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  if (error) throw error;
}
