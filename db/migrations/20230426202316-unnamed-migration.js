const sequelize = require('../../lib/sequelize');
const { Op } = require('sequelize');
const CountryService = require('../../services/countries.service');
const UpdatableSevice = require('../../services/updatable.service');
const { COUNTRY_TABLE, CountrySchema } = require('../models/country.model');
const {
  ROOM_USER_TABLE,
  RoomUserSchema,
} = require('../models/room-user.model');
const { ROOM_TABLE, RoomSchema } = require('../models/room.model');
const {
  UPDATABLE_TABLE,
  UpdatableSchema,
} = require('../models/updatable.model');
const {
  USER_COUNTRY_TABLE,
  UserCountrySchema,
} = require('../models/user-country.model');
const { USER_TABLE, UserSchema } = require('../models/user.model');

const countryService = new CountryService();
const updatableService = new UpdatableSevice();

const constraints = `CREATE FUNCTION max_users_constraint() RETURNS BOOLEAN AS $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM users;
  RETURN row_count < 200;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE users ADD CONSTRAINT max_users CHECK (max_users_constraint());

------

CREATE FUNCTION max_rooms_constraint() RETURNS BOOLEAN AS $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM rooms;
  RETURN row_count < 500;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE rooms ADD CONSTRAINT max_rooms CHECK (max_rooms_constraint());

-------

CREATE FUNCTION max_songs_constraint() RETURNS BOOLEAN AS $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM countries;
  RETURN row_count <= 26;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE countries ADD CONSTRAINT max_songs CHECK (max_songs_constraint());`;

const drop_constraint = `DROP FUNCTION max_users_constraint(); DROP FUNCTION max_rooms_constraint(); DROP FUNCTION max_songs_constraint();`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropAllTables();
    await queryInterface.createTable(COUNTRY_TABLE, CountrySchema);
    await queryInterface.createTable(UPDATABLE_TABLE, UpdatableSchema);
    await queryInterface.createTable(USER_TABLE, UserSchema);
    await queryInterface.createTable(ROOM_TABLE, RoomSchema);
    await countryService.initialize('2023');
    await updatableService.initialize();
    await queryInterface.createTable(ROOM_USER_TABLE, RoomUserSchema);
    await queryInterface.createTable(USER_COUNTRY_TABLE, UserCountrySchema);
    await queryInterface.addConstraint(USER_COUNTRY_TABLE, {
      type: 'unique',
      fields: ['user_id', 'country_id'],
      name: 'unique_user_country',
    });
    await queryInterface.addConstraint(ROOM_USER_TABLE, {
      type: 'unique',
      fields: ['user_id', 'room_id'],
      name: 'unique_user_room',
    });

    await sequelize.query(constraints);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropAllTables({
      truncate: true,
      restartIdentity: true,
    });
    await sequelize.query(drop_constraint);
  },
};
