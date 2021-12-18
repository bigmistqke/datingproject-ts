const { unflatten } = require('flat');

function DatabaseManager({ _mongo, _redis }) {
  this.init = async () => {
    await _redis.init();
    await _mongo.init();
  }

  // SCRIPT

  this.saveScript = async ({ script_id, script }) =>
    await _mongo.getCollection('scripts').updateDocument({ script_id }, script)

  this.getScript = async (script_id) => _mongo.getCollection('scripts')
    .findDocument({ script_id });

  this.testScript = async ({ script_id, script }) => {
    let { room_url, room } = await this.room.create({ script, script_id });
    let roles = {};
    Object.entries(room.roles).map(
      ([player_id, role]) =>
        roles[player_id] = { role_id: role.role_id, instructions: role.instructions }
    );
    return { roles, room_url }
  }

  this.convertAllScripts = async () => {
    let keys = await _redis.getAllKeys();
    //console.log(keys);
    if (!keys) return;
    let script_keys = keys.filter(key => key.indexOf('_temp') != -1);

    let script_ids = [];
    script_keys.forEach(script_key => {
      let id = script_key.split('_')[1];
      if (script_ids.indexOf(id) == -1)
        script_ids.push(id);
    })
    //console.log(script_ids);

    let scripts = {};
    for (let script_id of script_ids) {
      //console.log('find', await _mongo.getCollection('scripts').findDocument({ script_id }))
      if (!await _mongo.getCollection('scripts').findDocument({ script_id })) {
        let blocks = Object.values(unflatten(await _redis.get(`s_${script_id}_temp_blocks`)));
        let instructions = unflatten(await _redis.get(`s_${script_id}_temp_instructions`), true);
        let roles = unflatten(await _redis.get(`s_${script_id}_temp_roles`), true);
        //console.log({ blocks, instructions, roles });
        scripts[script_id] = {
          blocks, instructions, roles, script_id
        }
        await _mongo.getCollection('scripts').insertDocument({ blocks, instructions, roles, script_id })
      }

    }

    //console.log(scripts);

    return scripts;

  }

  // CARD

  this.saveDesign = async ({ design, design_id }) => {

    _mongo.getCollection('cards').updateDocument({ card_id: design_id }, { design });

  }

  this.getDesign = async ({ design_id }) => {
    // TODO: check cache
    console.log('get the deck with card_id ', design_id)
    let data = await _mongo.getCollection('cards').findDocument({ card_id: design_id });
    if (!data) return false;
    return data.design
  }
}





module.exports = DatabaseManager;