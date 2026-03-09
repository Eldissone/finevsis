function initialsFromUser(user) {
  const source = user?.name || user?.email || 'FV';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('');
}

export default function AvatarBadge({ user, className = 'h-14 w-14' }) {
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || 'Avatar'}
        className={`${className} rounded-[1.25rem] border border-sand object-cover shadow-paper`}
      />
    );
  }

  return (
    <div className={`avatar-fallback ${className}`}>
      {initialsFromUser(user)}
    </div>
  );
}
