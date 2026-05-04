import { prepareKamaradeDerivedData } from "./kamarade.mjs";
import { prepareSoyouzDerivedData } from "./soyouz.mjs";

export class StarMarxActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();

    switch (this.type) {
      case "kamarade":
        prepareKamaradeDerivedData(this);
        break;
      case "soyouz":
        prepareSoyouzDerivedData(this);
        break;
    }
  }

  getRollData() {
    const data = super.getRollData();
    return data;
  }
}
