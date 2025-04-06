{/* ログイン済みの場合は追加メニュー */}
{session && (
  <>
    <NavLink href="/dashboard">ダッシュボード</NavLink>
    {session.user.isAdmin && (
      <NavLink href="/admin">管理者</NavLink>
    )}
  </>
)} 