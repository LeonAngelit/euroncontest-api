const { User, UserSchema } = require('./user.model');
const { Country, CountrySchema } = require('./country.model');
const { Room, RoomSchema } = require('./room.model');
const { RoomUser, RoomUserSchema } = require('./room-user.model');
const { UserCountry, UserCountrySchema } = require('./user-country.model');
const { UpdatableSchema, Updatable } = require('./updatable.model');

function setupModels(sequelize) {
  UserCountry.init(UserCountrySchema, UserCountry.config(sequelize));
  RoomUser.init(RoomUserSchema, RoomUser.config(sequelize));
  User.init(UserSchema, User.config(sequelize));
  Country.init(CountrySchema, Country.config(sequelize));
  Room.init(RoomSchema, Room.config(sequelize));
  Updatable.init(UpdatableSchema, Updatable.config(sequelize));
  UserCountry.addHook(
    'beforeValidate',
    'checkWinnerOption',
    (userCountry, options) => {
      if (userCountry.winner_option) {
        return UserCountry.findOne({
          where: { user_id: userCountry.user_id, winner_option: true },
        }).then((result) => {
          if (result) {
            throw new Error('User cannot have more than one winner option');
          }
        });
      }
    }
  );

  UserCountry.associate(sequelize.models);
  RoomUser.associate(sequelize.models);
  User.associate(sequelize.models);
  Country.associate(sequelize.models);
  Updatable.associate(sequelize.models);
  Room.associate(sequelize.models);
}

module.exports = setupModels;
