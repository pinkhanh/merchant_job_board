'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

type Account = {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: string;
};

type RowAction = { type: 'password' } | { type: 'delete' } | null;

export default function AccountsTab({ merchantId }: { merchantId: string }) {
  const showToast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({});
  const [pwForm, setPwForm] = useState<Record<string, { password: string; confirm: string }>>({});

  useEffect(() => {
    fetch(`/api/admin/merchants/${merchantId}/accounts`)
      .then((r) => r.json())
      .then(setAccounts);
  }, [merchantId]);

  function toggleRowAction(accountId: string, type: 'password' | 'delete') {
    setRowAction((prev) => ({
      ...prev,
      [accountId]: prev[accountId]?.type === type ? null : { type },
    }));
    if (type === 'password') {
      setPwForm((prev) => ({ ...prev, [accountId]: { password: '', confirm: '' } }));
    }
  }

  async function handleAdd() {
    if (addForm.password !== addForm.confirmPassword) {
      showToast('error', 'Mật khẩu xác nhận không khớp');
      return;
    }
    const res = await fetch(`/api/admin/merchants/${merchantId}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: addForm.username, password: addForm.password }),
    });
    if (res.ok) {
      const newAccount: Account = await res.json();
      setAccounts((prev) => [newAccount, ...prev]);
      setShowAddForm(false);
      setAddForm({ username: '', password: '', confirmPassword: '' });
      showToast('success', 'Đã tạo tài khoản');
    } else {
      const body = await res.json();
      showToast('error', body.error ?? 'Tạo tài khoản thất bại');
    }
  }

  async function toggleActive(account: Account) {
    const res = await fetch(`/api/admin/merchants/${merchantId}/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !account.isActive }),
    });
    if (res.ok) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isActive: !a.isActive } : a))
      );
      showToast('success', !account.isActive ? 'Đã mở tài khoản' : 'Đã khoá tài khoản');
    } else {
      showToast('error', 'Cập nhật thất bại');
    }
  }

  async function handlePasswordChange(accountId: string) {
    const f = pwForm[accountId];
    if (!f) return;
    if (f.password !== f.confirm) {
      showToast('error', 'Mật khẩu xác nhận không khớp');
      return;
    }
    const res = await fetch(`/api/admin/merchants/${merchantId}/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: f.password }),
    });
    if (res.ok) {
      setRowAction((prev) => ({ ...prev, [accountId]: null }));
      setPwForm((prev) => {
        const copy = { ...prev };
        delete copy[accountId];
        return copy;
      });
      showToast('success', 'Đã đổi mật khẩu');
    } else {
      showToast('error', 'Đổi mật khẩu thất bại');
    }
  }

  async function handleDelete(accountId: string) {
    const res = await fetch(`/api/admin/merchants/${merchantId}/accounts/${accountId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      setRowAction((prev) => {
        const copy = { ...prev };
        delete copy[accountId];
        return copy;
      });
      showToast('success', 'Đã xoá tài khoản');
    } else {
      const body = await res.json();
      showToast('error', body.error ?? 'Xoá thất bại');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tài khoản quản lý</h2>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover"
        >
          + Thêm mới
        </button>
      </div>

      {showAddForm && (
        <div className="bg-primary-surface border border-border rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">Tạo tài khoản mới</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Tên đăng nhập
              </label>
              <input
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Mật khẩu
              </label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={addForm.confirmPassword}
                onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddForm({ username: '', password: '', confirmPassword: '' });
              }}
              className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-white"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!addForm.username || !addForm.password || !addForm.confirmPassword}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
            >
              Tạo tài khoản
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-primary text-white text-xs uppercase">
              <th className="px-4 py-3 text-left">Tên đăng nhập</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Ngày tạo</th>
              <th className="px-4 py-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <React.Fragment key={account.id}>
                <tr className="border-b border-border hover:bg-primary-surface">
                  <td className="px-4 py-3 font-medium">{account.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                        account.isActive
                          ? 'bg-status-active-bg text-status-active-text'
                          : 'bg-status-off-bg text-status-off-text'
                      }`}
                    >
                      {account.isActive ? 'Hoạt động' : 'Đã khoá'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Date(account.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRowAction(account.id, 'password')}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-primary-surface"
                      >
                        Đổi MK
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(account)}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-primary-surface"
                      >
                        {account.isActive ? 'Khoá' : 'Mở'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRowAction(account.id, 'delete')}
                        disabled={accounts.length <= 1}
                        title={accounts.length <= 1 ? 'Không thể xoá tài khoản duy nhất' : undefined}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-primary-surface disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>

                {rowAction[account.id]?.type === 'password' && (
                  <tr className="bg-primary-surface border-b border-border">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex items-end gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-text-secondary">
                            Mật khẩu mới
                          </label>
                          <input
                            type="password"
                            value={pwForm[account.id]?.password ?? ''}
                            onChange={(e) =>
                              setPwForm((prev) => ({
                                ...prev,
                                [account.id]: { ...prev[account.id], password: e.target.value },
                              }))
                            }
                            className="border border-border rounded-md px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-text-secondary">Xác nhận</label>
                          <input
                            type="password"
                            value={pwForm[account.id]?.confirm ?? ''}
                            onChange={(e) =>
                              setPwForm((prev) => ({
                                ...prev,
                                [account.id]: { ...prev[account.id], confirm: e.target.value },
                              }))
                            }
                            className="border border-border rounded-md px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePasswordChange(account.id)}
                          disabled={!pwForm[account.id]?.password}
                          className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setRowAction((prev) => ({ ...prev, [account.id]: null }))}
                          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-white"
                        >
                          Huỷ
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {rowAction[account.id]?.type === 'delete' && (
                  <tr className="bg-red-50 border-b border-border">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-red-700">
                          Xác nhận xoá tài khoản{' '}
                          <strong>{account.username}</strong>?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(account.id)}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Xoá
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRowAction((prev) => ({ ...prev, [account.id]: null }))
                          }
                          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-white"
                        >
                          Huỷ
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary text-sm">
                  Chưa có tài khoản nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
