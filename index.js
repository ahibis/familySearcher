const {
    Sequelize,
    Model,
    DataTypes
} = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

const Father = sequelize.define("father", {
    name: DataTypes.STRING,
    middleName: DataTypes.STRING,
    surname: DataTypes.STRING,
    birthday: DataTypes.DATE,
    income: DataTypes.INTEGER
});
const Mother = sequelize.define("mother", {
    name: DataTypes.STRING,
    middleName: DataTypes.STRING,
    surname: DataTypes.STRING,
    birthday: DataTypes.DATE,
    income: DataTypes.INTEGER
});
const Child = sequelize.define("child", {
    name: DataTypes.STRING,
    middleName: DataTypes.STRING,
    surname: DataTypes.STRING,
    birthday: DataTypes.DATE,
    income: DataTypes.INTEGER
});
const Family = sequelize.define("family",{})
Family.father = Family.hasOne(Father)
Family.mother = Family.hasOne(Mother)
Family.childs = Family.hasMany(Child,{as:"childs"})
let a;
async function addFamily(data){
    return await Family.create(data,{
        include:[
            {
                association:Family.father
            },
            {
                association:Family.mother
            },
            {
                association:Family.childs
            }
        ]
    })
}

(async () => {
    await sequelize.sync({
        alter: true
    })
    const familyData = require("./familyData.json")
    const family = await addFamily(familyData)
})();
