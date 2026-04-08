function mapActor(user) {
  if (!user) {
    return {
      id: null,
      role: null,
      name: null,
      email: null,
    };
  }

  return {
    id: user._id ? String(user._id) : user.id ? String(user.id) : null,
    role: user.role || null,
    name: user.name || null,
    email: user.email || null,
  };
}

module.exports = {
  mapActor,
};
