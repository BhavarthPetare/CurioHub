// Names can contain spaces and symbols, so always encode them for the URL.
export const avatarUrl = (name, background = '7311d4') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${background}&color=fff`;
