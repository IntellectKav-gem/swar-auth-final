const ROLES = Object.freeze({
  ADMIN: 'admin',
  FACULTY: 'faculty',
  STUDENT: 'student'
});

const VALID_ROLES = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, VALID_ROLES };
