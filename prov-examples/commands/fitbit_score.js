pvis.groupNodes({nodes: ['ir:step_achievement','ir:step_data','ir:step_goal','ir:step_tracker_data','ir:step_analyser','ir:step_transformer'],speed: 0})
.then(function(){
pvis.groupNodes({nodes: ['ir:aggregated_weight_data','ir:weight_scale_data','ir:weight_manual_data','ir:weight_aggregator'],speed: 0})
.then(function(){
pvis.groupNodes({nodes: ['ir:weight_success','ir:weight_goal','ir:weight_analyser','-1398091587'],speed: 0})
.then(function(){
pvis.renameNode("-254341073", "weight data")
.then(function(){
pvis.renameNode("852265121", "step data")
})})})})