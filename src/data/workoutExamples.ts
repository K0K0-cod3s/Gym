export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  group: string;
  instructions: string;
}

export const workoutExamples: Record<string, Exercise[]> = {
  'full-body': [
    {
      name: "Push-ups",
      sets: 3,
      reps: "8-12",
      group: "Chest",
      instructions: "Start in plank position with hands slightly wider than shoulders. Lower your body until chest nearly touches the floor, then push back up. Keep your core tight and body in a straight line throughout the movement. If too difficult, modify by doing them on your knees."
    },
    {
      name: "Dumbbell Shoulder Press",
      sets: 3,
      reps: "10-12",
      group: "Shoulders",
      instructions: "Stand with feet shoulder-width apart, holding dumbbells at shoulder height with palms facing forward. Press the weights straight up overhead until arms are fully extended. Lower back to starting position with control. Keep your core engaged and avoid arching your back."
    },
    {
      name: "Dumbbell Bicep Curls",
      sets: 3,
      reps: "12-15",
      group: "Arms",
      instructions: "Stand with dumbbells at your sides, palms facing forward. Curl the weights up by flexing your biceps, keeping your elbows close to your body. Squeeze at the top, then lower slowly. Avoid swinging or using momentum - focus on controlled movement."
    },
    {
      name: "Tricep Dips (Chair)",
      sets: 3,
      reps: "8-12",
      group: "Arms",
      instructions: "Sit on edge of a sturdy chair, hands gripping the seat beside your hips. Slide forward off the chair, supporting your weight with your arms. Lower your body by bending your elbows to 90 degrees, then push back up. Keep your back close to the chair."
    },
    {
      name: "Plank",
      sets: 3,
      reps: "30-60 sec",
      group: "Core",
      instructions: "Start in push-up position but rest on your forearms instead of hands. Keep your body in a straight line from head to heels. Engage your core, glutes, and legs. Breathe normally and hold the position. Don't let your hips sag or pike up."
    },
    {
      name: "Mountain Climbers",
      sets: 3,
      reps: "20-30",
      group: "Core",
      instructions: "Start in plank position. Quickly alternate bringing your knees toward your chest, as if running in place horizontally. Keep your core tight and maintain the plank position with your upper body. Move at a controlled but rapid pace."
    }
  ],

  'glutes': [
    {
      name: "Goblet Squats",
      sets: 4,
      reps: "12-15",
      group: "Glutes",
      instructions: "Hold a dumbbell vertically against your chest with both hands. Stand with feet slightly wider than shoulder-width. Lower into a squat by pushing your hips back and bending your knees. Go down until thighs are parallel to floor, then drive through your heels to stand up. Focus on squeezing your glutes at the top."
    },
    {
      name: "Romanian Deadlifts",
      sets: 4,
      reps: "10-12",
      group: "Glutes",
      instructions: "Hold dumbbells in front of your thighs with feet hip-width apart. Hinge at the hips by pushing your butt back and lowering the weights while keeping your back straight. Feel a stretch in your hamstrings, then drive your hips forward to return to standing. Focus on the hip hinge movement."
    },
    {
      name: "Bulgarian Split Squats",
      sets: 3,
      reps: "10-12 each leg",
      group: "Glutes",
      instructions: "Stand 2-3 feet in front of a chair or couch. Place the top of one foot behind you on the elevated surface. Lower into a lunge by bending your front knee until thigh is parallel to floor. Push through your front heel to return to start. Complete all reps on one leg before switching."
    },
    {
      name: "Glute Bridges",
      sets: 3,
      reps: "15-20",
      group: "Glutes",
      instructions: "Lie on your back with knees bent and feet flat on floor, hip-width apart. Squeeze your glutes and push through your heels to lift your hips up, creating a straight line from knees to shoulders. Hold for 1-2 seconds at the top, then lower slowly. Focus on glute activation."
    },
    {
      name: "Lateral Lunges",
      sets: 3,
      reps: "10-12 each side",
      group: "Glutes",
      instructions: "Stand with feet together. Take a large step to the right, pushing your hips back and bending your right knee while keeping your left leg straight. Push off your right foot to return to center. Alternate sides or complete all reps on one side first. Keep your chest up throughout."
    },
    {
      name: "Single-Leg Hip Thrusts",
      sets: 3,
      reps: "8-10 each leg",
      group: "Glutes",
      instructions: "Lie with your upper back against a couch or chair, knees bent. Extend one leg straight out. Drive through the heel of your planted foot to lift your hips up, squeezing your glutes hard at the top. Lower slowly and repeat. This is an advanced glute isolation exercise."
    }
  ],

  'abs': [
    {
      name: "Bicycle Crunches",
      sets: 3,
      reps: "20-30 each side",
      group: "Core",
      instructions: "Lie on your back with hands behind your head and legs lifted with knees bent at 90 degrees. Bring your right elbow toward your left knee while extending your right leg. Switch sides in a pedaling motion. Focus on rotating your torso, not just moving your elbows."
    },
    {
      name: "Dead Bug",
      sets: 3,
      reps: "10-12 each side",
      group: "Core",
      instructions: "Lie on your back with arms extended toward ceiling and knees bent at 90 degrees. Slowly lower your right arm overhead while extending your left leg until both nearly touch the floor. Return to start and repeat with opposite limbs. Keep your lower back pressed to the floor throughout."
    },
    {
      name: "Russian Twists",
      sets: 3,
      reps: "20-30 total",
      group: "Obliques",
      instructions: "Sit with knees bent and feet slightly off the ground, leaning back to create a V-shape with your torso and thighs. Hold a dumbbell with both hands and rotate your torso left and right, touching the weight to the floor beside your hips. Keep your chest up and core engaged."
    },
    {
      name: "Plank to Downward Dog",
      sets: 3,
      reps: "10-15",
      group: "Core",
      instructions: "Start in a plank position on your hands. Keeping your hands planted, push your hips up and back into a downward dog position, creating an inverted V-shape. Return to plank position. This movement engages your entire core while adding mobility."
    },
    {
      name: "Hollow Body Hold",
      sets: 3,
      reps: "20-40 seconds",
      group: "Core",
      instructions: "Lie on your back and press your lower back into the floor. Lift your shoulders and legs off the ground, creating a 'hollow' or banana shape with your body. Hold this position while breathing normally. This is an advanced core stability exercise."
    },
    {
      name: "Dumbbell Wood Chops",
      sets: 3,
      reps: "12-15 each side",
      group: "Obliques",
      instructions: "Hold a dumbbell with both hands and stand with feet shoulder-width apart. Start with the weight at one shoulder and 'chop' diagonally across your body to the opposite hip, rotating your torso. Control the movement back to start. Complete all reps on one side before switching."
    }
  ]
};