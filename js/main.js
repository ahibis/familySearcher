const { Sequelize, Model, DataTypes, Op } = require("sequelize");
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,
});

const Father = sequelize.define("father", {
  name: DataTypes.STRING,
  middleName: DataTypes.STRING,
  surname: DataTypes.STRING,
  birthday: {
    type: Sequelize.DATEONLY,
    get() {
      const val = this.getDataValue("birthday");
      return val;
    },
  },
  income: DataTypes.INTEGER,
});
const Mother = sequelize.define("mother", {
  name: DataTypes.STRING,
  middleName: DataTypes.STRING,
  surname: DataTypes.STRING,
  birthday: Sequelize.DATEONLY,
  income: DataTypes.INTEGER,
});
const Child = sequelize.define("child", {
  name: DataTypes.STRING,
  middleName: DataTypes.STRING,
  surname: DataTypes.STRING,
  birthday: Sequelize.DATEONLY,
  income: DataTypes.INTEGER,
  twin: {
    type: DataTypes.STRING,
    defaultValue: "нет близнеца",
  },
});
const Family = sequelize.define("family", {});
Family.father = Family.hasOne(Father);
Family.mother = Family.hasOne(Mother);
Family.childs = Family.hasMany(Child, { as: "childs" });
(async function () {
  //await sequelize.sync({alter:true})
})();
let a;
async function addFamily(data) {
  return await Family.create(data, {
    include: [
      {
        association: Family.father,
      },
      {
        association: Family.mother,
      },
      {
        association: Family.childs,
      },
    ],
  });
}
const middleNames = {
  Валерий: "Валерьевич",
  Геннадий: "Геннадьевич",
  Анатолий: "Анатольевич",
  Никита: "Никитович",
  Павел: "Павлович",
  Иван: "Иванович",
  Петр: "Петрович"
}
const randInt = (a,b)=>a+~~((b-a)*Math.random())
const getIncome = ()=>randInt(0,50)*50
const getBirthday = ()=>`${randInt(1990,2025)}-0${randInt(0,10)}-0${randInt(0,10)}`
const getName = ()=>_.keys(middleNames)[randInt(0,_.keys(middleNames).length)]
const newFamily = {
  father: {
    name: getName(),
    middleName: "Павлович",
    surname: "Зябликов",
    birthday: getBirthday(),
    income: getIncome(),
  },
  mother: {
    name: "Александра",
    middleName: "Валерьевна",
    surname: "Зябликовна",
    birthday: getBirthday(),
    income: getIncome(),
  },
  childs: [
    {
      name: getName(),
      middleName: "Геннадьевич",
      surname: "Зябликов",
      birthday: getBirthday(),
      income: getIncome(),
      twin: "нет близнеца",
    },
    {
      name: getName(),
      middleName: "Геннадьевич",
      surname: "Зябликов",
      birthday: getBirthday(),
      income: getIncome(),
      twin: "нет близнеца",
    },
  ],
};
Vue.component("person", {
  props: ["data"],
  template: `<div class="grid">
    фамилия<input v-model="data.surname" />
    имя<input v-model="data.name" /> 
    отчество<input v-model="data.middleName"/>
    дата рождения<input v-model="data.birthday" type="date" />
    заработок<input v-model="data.income" type="number" />
  </div>`,
});
Vue.component("child", {
  props: ["data", "twins"],
  template: `<div class="grid">
    фамилия<input v-model="data.surname" />
    имя<input v-model="data.name" /> 
    отчество<input v-model="data.middleName"/>
    дата рождения<input v-model="data.birthday" type="date" />
    заработок<input v-model="data.income" type="number" />
    близнец<select v-model="data.twin">
    <option v-for="twin in twins">{{twin}}</option>
    </select>
  </div>`,
});
let oldFamily;
const vm = new Vue({
  el: "#app",
  data: {
    mode: +localStorage.mode || 1,
    familyId: +localStorage.familyId || 1,
    familyUpdated: 0,
    modes: [
      "Добавить семью",
      "редактировать семью",
      "существует ли в бд заданный человек",
      "найти всех работающих детей",
      "Найти всех работающих мужей, у которых доход больше чем у жены",
      "Найти всех людей, которые не работают и родились до указанного",
      "найти число семей у которых есть близнецы",
    ],
    newFamily,
    middleNames,
    searchName: "",
    myDate: "2022-10-09",
  },
  computed: {
    twins() {
      const childs = this.newFamily.childs.map(
        (e) => `${e.surname} ${e.name} ${e.middleName}`
      );
      return childs.map((e, i) => [
        "нет близнеца",
        ...childs.filter((v, k) => i != k),
      ]);
    },
  },
  asyncComputed: {
    familiesCount: {
      async get() {
        return (
          await Family.findOne({
            order: [["id", "DESC"]],
          })
        ).id;
      },
      watch: ["familyUpdated"],
    },
    async family() {
      return await Family.findByPk(this.familyId, {
        include: [Family.father, Family.mother, Family.childs],
      });
    },
    async z1() {
      const [surname, name, middleName] = [
        ...this.searchName.split(" "),
        "",
        "",
        "",
      ];
      const first = await Father.findOne({
        where: { name, middleName, surname },
      });
      const second = await Mother.findOne({
        where: { name, middleName, surname },
      });
      const third = await Child.findOne({
        where: { name, middleName, surname },
      });
      return first || second || third;
    },
    async z2() {
      const childs = await Child.findAll({
        where: {
          income: {
            [Op.gt]: 0,
          },
        },
      });
      return childs;
    },
    async z3() {
      const families = await Family.findAll({
        include: [Family.father, Family.mother, Family.childs],
      });
      return families
        .filter((e) => e.father && e.father.income > e?.mother.income)
        .map((e) => e.father);
    },
    async z4() {
      const first = await Father.findAll({
        where: {
          income: 0,
          birthday: {
            [Op.lt]: this.myDate,
          },
        },
      });
      const second = await Mother.findAll({
        where: {
          income: 0,
          birthday: {
            [Op.lt]: this.myDate,
          },
        },
      });
      const third = await Child.findAll({
        where: {
          income: 0,
          birthday: {
            [Op.lt]: this.myDate,
          },
        },
      });
      return [...first, ...second, ...third];
    },
    z5: {
      async get() {
        const families = await Family.findAll({
          include: [Family.father, Family.mother, Family.childs],
        });
        return families.filter(
          (e) => e.childs.filter((v) => v.twin != "нет близнеца").length
        ).length;
      },
      watch:["familyUpdated"]
    },
  },
  watch: {
    familyId(val) {
      localStorage.familyId = val;
    },
    mode(val) {
      localStorage.mode = val;
    },
    newFamily: {
      deep: true,
      handler(val) {
        if (!oldFamily) oldFamily = val;
        if (val?.father?.surname != oldFamily?.father?.surname) {
          const { surname } = val.father;
          val.mother.surname = surname;
          val.childs.forEach((e, i) => (val.childs[i].surname = surname));
        }
        if (val?.father?.name != oldFamily?.father?.name) {
          const { name } = val.father;
          if (this.middleNames[name])
            val.childs.forEach(
              (e, i) => (val.childs[i].middleName = this.middleNames[name])
            );
        }
        oldFamily = _.cloneDeep(val);
      },
    },
  },
  methods: {
    deleteChild(childId) {
      Vue.delete(this.newFamily.childs, childId);
    },
    addChild() {
      this.newFamily.childs.push({
        name: "Галина",
        middleName: this.middleNames[this.newFamily.father.name] || "Виктровна",
        surname: this.newFamily.father.surname,
        birthday: getBirthday(),
        income: getIncome(),
        twin: "нет близнеца",
      });
    },
    async saveFamily() {
      const family = await addFamily(this.newFamily);
      this.familyUpdated+=1
      alert("семья успешно добавлена");
    },
  },
});
