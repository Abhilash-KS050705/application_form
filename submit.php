<?php

// simple HTML-escape helper
if (!function_exists('h')) {
	function h($s) {
		return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
	}
}

$fullname = isset($_POST['fullname']) ? h($_POST['fullname']) : '';
$email = isset($_POST['email']) ? h($_POST['email']) : '';
$phone = isset($_POST['phone']) ? h($_POST['phone']) : '';
$dob = isset($_POST['dob']) ? h($_POST['dob']) : '';
$gender = isset($_POST['gender']) ? h($_POST['gender']) : '';
$address = isset($_POST['address']) ? nl2br(h($_POST['address'])) : '';
$course = isset($_POST['course']) ? h($_POST['course']) : '';

// handle uploaded photo (optional)
$photoTag = '';
if (isset($_FILES['photo']) && isset($_FILES['photo']['error']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
	$f = $_FILES['photo'];
	$allowed = ['image/jpeg', 'image/png', 'image/gif'];
	if (isset($f['type']) && in_array($f['type'], $allowed)) {
		// save into an uploads folder (create if not exists)
		$uploaddir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
		if (!is_dir($uploaddir)) {
			@mkdir($uploaddir, 0755, true);
		}
		$safeName = time() . '_' . preg_replace('/[^A-Za-z0-9_\-.]/', '_', basename($f['name']));
		$target = $uploaddir . DIRECTORY_SEPARATOR . $safeName;
		if (@move_uploaded_file($f['tmp_name'], $target)) {
			// create an accessible URL if your host serves this folder
			$urlPath = 'uploads/' . rawurlencode($safeName);
			$photoTag = '<img src="' . $urlPath . '" alt="photo" />';
		}
	}
}

// if no saved file, try to embed as base64 (fallback)
if (empty($photoTag) && isset($_FILES['photo']) && isset($_FILES['photo']['tmp_name']) && is_uploaded_file($_FILES['photo']['tmp_name'])) {
	$data = @file_get_contents($_FILES['photo']['tmp_name']);
	$type = isset($_FILES['photo']['type']) ? $_FILES['photo']['type'] : '';
	if ($data !== false && strpos($type, 'image/') === 0) {
		$b64 = 'data:' . $type . ';base64,' . base64_encode($data);
		$photoTag = '<img src="' . $b64 . '" alt="photo" />';
	}
}

// placeholder
if (empty($photoTag)) {
	$photoTag = '<div class="placeholder">No photo</div>';
}

// Build safe formatted HTML output
$output = <<<HTML
<div class="result-card">
  <div class="result-photo">$photoTag</div>
  <div class="result-meta">
	<h2>{$fullname}</h2>
	<p><strong>Email:</strong> {$email}</p>
	<p><strong>Phone:</strong> {$phone}</p>
	<p><strong>DOB:</strong> {$dob} &nbsp; <strong>Gender:</strong> {$gender}</p>
	<p><strong>Program:</strong> {$course}</p>
	<p><strong>Address:</strong><br>{$address}</p>

	<div class="result-actions">
	  <button onclick="window.print()">Print / Save PDF</button>
	  <button onclick="location.reload()">Start New</button>
	</div>
  </div>
</div>
HTML;

// echo the styled snippet
echo $output;