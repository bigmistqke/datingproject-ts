const ArchiveHelper = function (initial_state_changes) {
  this.state_changes = initial_state_changes;
  this.state_has_changed = false;

  this.init = (initial_state_changes) => {
    this.state_changes = initial_state_changes;
  }
  this.update = (updated_state_changes) => {
    if (
      !updated_state_changes
      || updated_state_changes.length === 0
      || updated_state_changes.length !== this.state_changes.length
    ) {
      console.error("updated_state_changes is incorrect");
      return false;
    }

    this.state_changes = this.state_changes.map((state_change, index) => {
      if (!this.state_has_changed && state_change.new_value !== updated_state_changes[index].new_value)
        this.state_has_changed = true;
      return {
        ...state_change,
        new_value: updated_state_changes[index].new_value,
      }
    });
    return this.state_changes;
  }
}

export default ArchiveHelper;