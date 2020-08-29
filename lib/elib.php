<?php

$species_names = array('Cantus', 1, 2, 3, 4, 5, 'Mixed', 'Free');
$timesigs = array('2/4', '3/4', '2/2', '4/4', '5/4', '6/4', '3/2');

function show_elock($private) {
  GLOBAL $bheight, $vtypes;
  if ($private == 1) echo "<img data-toggle=tooltip data-html=true data-container=body data-bondary=window data-placement=bottom title='Access allowed to all authenticated users' src=img/lock3.png height=$bheight> ";
  if ($private == 2) echo "<img data-toggle=tooltip data-html=true data-container=body data-bondary=window data-placement=bottom title='Access allowed to author and administrators only' src=img/lock.png height=$bheight> ";
  if ($private >= 3) echo "<img data-toggle=tooltip data-html=true data-container=body data-bondary=window data-placement=bottom title='Access allowed to author only' src=img/lock2.png height=$bheight> ";
}

function show_keysig_stat($suid) {
  GLOBAL $ml;
  $r = query("
    SELECT keysig, COUNT(*) AS cnt
    FROM exercises
    WHERE u_id=$suid
    GROUP BY keysig
    ORDER BY cnt DESC
  ");
  $n = mysqli_num_rows($r);
  echo "<p><table class='table table-striped table-bordered' style='max-width:300px'>"; // table-hover
  echo "<thead>";
  echo "<tr>";
  echo "<th scope=col>Key signature</th>";
  echo "<th scope=col>Exercises</th>";
  echo "</tr>\n";
  echo "</thead>";
  echo "<tbody>";
  for ($i=0; $i<$n; ++$i) {
    $w = mysqli_fetch_assoc($r);
    echo "<tr>";
    echo "<td>$w[keysig]";
    echo "<td>$w[cnt]";
  }
  echo "</table>";
}

function show_timesig_stat($suid) {
  GLOBAL $ml;
  $r = query("
    SELECT timesig, COUNT(*) AS cnt
    FROM exercises
    WHERE u_id=$suid
    GROUP BY timesig
    ORDER BY cnt DESC
  ");
  $n = mysqli_num_rows($r);
  echo "<p><table class='table table-striped table-bordered' style='max-width:300px'>"; // table-hover
  echo "<thead>";
  echo "<tr>";
  echo "<th scope=col>Time signature</th>";
  echo "<th scope=col>Exercises</th>";
  echo "</tr>\n";
  echo "</thead>";
  echo "<tbody>";
  for ($i=0; $i<$n; ++$i) {
    $w = mysqli_fetch_assoc($r);
    echo "<tr>";
    echo "<td>$w[timesig]";
    echo "<td>$w[cnt]";
  }
  echo "</table>";
}

function get_species($st) {
  $cnt = array();
  $max_species = 0;
  if (strpos($st, 'C') === false) {
    if (strpos($st, '1') !== false) {
      $st[strpos($st, '1')] = 'C';
    }
  }
  for ($i=0; $i<strlen($st); ++$i) {
    $char = $st[$i];
    $cnt[$char] ++;
    if ($char == 'C') continue;
    if ($char > $max_species) $max_species = $char;
  }
  if (strlen($st) == 1) return 'Cantus';
  if (strlen($st) == 2 && $cnt['C']) return $max_species;
  if (strlen($st) == 3 && $cnt['C']) return $max_species;
  if (!$cnt['C']) return 'Free';
  return 'Mixed';
}

function show_species_timesig_stat($suid) {
  GLOBAL $ml, $species_names, $timesigs;
  $r = query("
    SELECT timesig, species
    FROM exercises
    WHERE u_id=$suid AND species != '' AND timesig != ''
  ");
  $n = mysqli_num_rows($r);
  $cnt = array();
  for ($i=0; $i<$n; ++$i) {
    $w = mysqli_fetch_assoc($r);
    $species = get_species($w['species']);
    $cnt[$w['timesig'] . ':' . $species] ++;
  }
  echo "<p><table class='table table-bordered table-striped' style='max-width:900px'>"; // table-hover
  echo "<thead>";
  echo "<tr>";
  echo "<th scope=col>Time signature</th>";
  foreach ($species_names as $species) {
    echo "<th scope=col class='text-center'>";
    if (is_numeric($species)) echo "Species ";
    echo $species;
  }
  echo "</thead>";
  echo "<tbody>";
  foreach ($timesigs as $timesig) {
    echo "<tr>";
    echo "<th>$timesig";
    foreach ($species_names as $species) {
      echo "<td class='text-center'>" . $cnt[$timesig . ":" . $species];
    }
  }
  echo "</table>";
}

function show_species_voices_stat($suid) {
  GLOBAL $ml, $species_names, $timesigs;
  $r = query("
    SELECT species
    FROM exercises
    WHERE u_id=$suid AND species != ''
  ");
  $n = mysqli_num_rows($r);
  $cnt = array();
  for ($i=0; $i<$n; ++$i) {
    $w = mysqli_fetch_assoc($r);
    $species = get_species($w['species']);
    $voices = strlen($w['species']);
    $cnt[$voices . ':' . $species] ++;
  }
  echo "<p><table class='table table-bordered table-striped' style='max-width:800px'>"; // table-hover
  echo "<thead>";
  echo "<tr>";
  echo "<th scope=col>Voices</th>";
  foreach ($species_names as $species) {
    echo "<th scope=col class='text-center'>";
    if (is_numeric($species)) echo "Species ";
    echo $species;
  }
  echo "</thead>";
  echo "<tbody>";
  for ($voices=1; $voices<6; ++$voices) {
    echo "<tr>";
    echo "<th>$voices voices";
    foreach ($species_names as $species) {
      echo "<td class='text-center'>" . $cnt[$voices . ":" . $species];
    }
  }
  echo "</table>";
}

function show_exercises($suid) {
  GLOBAL $ml, $ua, $uid, $login_result, $sua;
  if ($suid) {
    $cond = "AND exercises.u_id='$suid'";
    echo "<h3><center>Exercises by $sua[u_name]</center></h3>";
  } else {
    echo "<h3><center>Exercises</center></h3>";
  }
  echo "<table class='table'>"; // table-striped table-hover
  echo "<thead>";
  echo "<tr>";
  echo "<th scope=col>ID</th>";
  echo "<th scope=col>Published</th>";
  echo "<th scope=col>User</th>";
  echo "<th scope=col>Title</th>";
  echo "<th scope=col>Counterpoint</th>";
  echo "<th scope=col>Analysis</th>";
  echo "<th scope=col>Revisions</th>";
  echo "</tr>\n";
  echo "</thead>";
  echo "<tbody>";

  $r = query("
    SELECT * FROM exercises
    LEFT JOIN root_exercises USING (root_eid)
    LEFT JOIN users ON (exercises.u_id=users.u_id)
    WHERE eid=1 $cond
    ORDER BY root_eid DESC
    LIMIT 1000
  ");
  $n = mysqli_num_rows($r);
  for ($i=0; $i<$n; ++$i) {
    $w = mysqli_fetch_assoc($r);
    $uname = $w['u_name'] ? $w['u_name'] : $w['u_cookie'];
    // Authenticated
    if ($w['security'] > 0 && !$login_result) {
      continue;
    }
    // Admin
    if ($w['security'] == 2 && !$ua['u_admin'] && $ua['u_login'] != $w['u_cookie'] && $uid != $w['u_id']) {
      continue;
    }
    // Private
    if ($w['security'] == 3 && $ua['u_login'] != $w['u_cookie'] && $uid != $w['u_id']) {
      continue;
    }
    echo "<tr>";
    echo "<td>$w[root_eid]</td>";
    echo "<td><a href='exercise.php?id=$w[root_eid]'>$w[publish_time]</td>";
    echo "<td><a href=user.php?suid=$w[u_id]>$uname</td>";
    echo "<td>";
    show_elock($w['security']);
    echo "<a href='exercise.php?id=$w[root_eid]'>";
    echo "$w[title]";
    echo "<td>";
    echo "$w[keysig] $w[timesig] $w[vocra] $w[species]";
    echo "<td> ";
    if ($w['algo'] == 'CA3') {
      if ($w['ecount'] < 10) {
        echo "<a target=_blank href='editor.html?state=$w[state]&rid=$w[root_eid]&eid=$w[eid]' role=button>";
        if ($w['flags'] == 0) {
          echo "✅";
        } else {
          if (floor($w['flags'] / 10000)) {
            echo floor($w['flags'] / 10000) . "🚩 &nbsp;";
          }
          if ($w['flags'] % 10000) {
            echo ($w['flags'] % 10000) . "⚠️";
          }
        }
        echo "</a>";
      } else {
        echo "<a href='exercise.php?id=$w[root_eid]'>...";
      }
    }
    echo "<td>$w[ecount] ";
    echo "</tr>";
  }
  echo "</tbody>";
  echo "</table>";
}
