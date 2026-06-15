let users: any[] = [];

export const createUser = (data: any) => {
  const user = { id: Date.now().toString(), ...data };
  users.push(user);
  return user;
};

export const getUsers = () => {
  return users;
};

export const getUserById = (id: string) => {
  return users.find(u => u.id === id);
};