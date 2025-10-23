(function(){
	// small helper to create and show toast
	function showToast(msg){
		let $t = document.querySelector('.toast');
		if(!$t){
			$t = document.createElement('div');
			$t.className = 'toast';
			$t.setAttribute('role','status');
			$t.setAttribute('aria-live','polite');
			document.body.appendChild($t);
		}
		$t.textContent = msg;
		$t.classList.add('show');
		setTimeout(function(){ $t.classList.remove('show'); }, 3500);
	}

	function addInlineError(el, msg){
		const row = el.closest('.row');
		if(!row) return;
		row.classList.add('has-error');
		const existing = row.querySelector('.field-error');
		if(existing) existing.textContent = msg;
		else{
			const d = document.createElement('div');
			d.className = 'field-error';
			d.textContent = msg;
			row.appendChild(d);
		}
	}

	function clearErrors(form){
		form.querySelectorAll('.field-error').forEach(function(n){ n.remove(); });
		form.querySelectorAll('.has-error').forEach(function(n){ n.classList.remove('has-error'); });
	}

	// validation helpers
	var nameRe = /^[A-Za-zÀ-ÖØ-öø-ÿ'\- ]{2,100}$/;
	var emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
	var phoneRe = /^[0-9+()\-\s]{6,25}$/;

	document.addEventListener('DOMContentLoaded', function(){
		var form = document.getElementById('appForm');
		var submitBtn = document.getElementById('submitBtn');

		form.addEventListener('submit', function(e){
			e.preventDefault();
			clearErrors(form);

			var fullname = (document.getElementById('fullname').value || '').trim();
			var email = (document.getElementById('email').value || '').trim();
			var phone = (document.getElementById('phone').value || '').trim();
			var photoInput = document.getElementById('photo');
			var photo = photoInput.files && photoInput.files[0];

			var problems = [];

			if(!nameRe.test(fullname)){
				problems.push({el:document.getElementById('fullname'), msg:'Please enter your full name (2–100 letters).'});
			}

			if(!email || !emailRe.test(email) || email.length > 255){
				problems.push({el:document.getElementById('email'), msg:'Please enter a valid email address.'});
			}

			if(phone && !phoneRe.test(phone)){
				problems.push({el:document.getElementById('phone'), msg:'Please enter a valid phone number (6–25 characters).'});
			}

			if(photo){
				var allowed = ['image/jpeg','image/png','image/gif'];
				var maxSize = 2 * 1024 * 1024; // 2MB
				if(allowed.indexOf(photo.type) === -1){
					problems.push({el:photoInput, msg:'Photo must be JPG, PNG, or GIF.'});
				} else if(photo.size > maxSize){
					problems.push({el:photoInput, msg:'Photo must be smaller than 2 MB.'});
				}
			}

			if(problems.length){
				problems.forEach(function(p){ addInlineError(p.el, p.msg); });
				showToast('Please correct the highlighted fields and try again.');
				return;
			}

			// proceed with AJAX submit
			submitBtn.disabled = true;
			submitBtn.textContent = 'Submitting...';

			var data = new FormData(form);

			var xhr = new XMLHttpRequest();
			xhr.open('POST', form.getAttribute('action'));
			xhr.onload = function(){
				submitBtn.disabled = false;
				submitBtn.textContent = 'Submit Application';
														if(xhr.status >= 200 && xhr.status < 300){
															var resultHtml = xhr.responseText;
															// open a new centered page and write the result
															try{
																var w = window.open('', '_blank');
																var doc = w.document;
																var page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
																page += '<title>Submission Result</title>';
																page += '<link rel="stylesheet" href="style.css">';
																page += '<style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;background:var(--bg),var(--bg-accent);}';
																page += '.result-shell{max-width:820px;width:100%}</style>';
																page += '</head><body>';
																page += '<div class="result-shell">';
																page += resultHtml;
																page += '</div>';
																// attach behavior: make the Start New button go back to the app
																page += '<script>';
																page += "(function(){\n" +
																	"  try{\n" +
																	"    var btn = null;\n" +
																	"    // find a button with text 'Start New' or 'Submit New' (loose match)\n" +
																	"    Array.prototype.slice.call(document.querySelectorAll('button')).forEach(function(b){ if(!btn && /Start New|Submit New|Start Again|New Application/i.test(b.textContent.trim())) btn = b; });\n" +
																	"    if(btn){\n" +
																	"      btn.addEventListener('click', function(e){ e.preventDefault(); try{ if(window.opener && !window.opener.closed){ window.opener.location = 'index.html'; window.close(); } else { window.location = 'index.html'; } }catch(err){ window.location = 'index.html'; } });\n" +
																	"    }\n" +
																	"  }catch(e){ /* ignore */ }\n" +
																	"})();";
																page += '</script>';
																page += '</body></html>';
																doc.open();
																doc.write(page);
																doc.close();
																showToast('Result opened in a new centered page.');
															}catch(err){
																// fallback: open as blob URL
																var blob = new Blob(['<!doctype html><html><head><meta charset="utf-8"><title>Submission Result</title><link rel="stylesheet" href="style.css"></head><body><div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px">'+resultHtml+'</div></body></html>'], {type:'text/html'});
																var url = URL.createObjectURL(blob);
																window.open(url, '_blank');
																showToast('Result opened in a new page.');
															}
														}else{
															showToast('An error occurred. Please try again.');
														}
			};
			xhr.onerror = function(){
				submitBtn.disabled = false;
				submitBtn.textContent = 'Submit Application';
						showToast('An error occurred. Please try again.');
			};
			xhr.send(data);

		});

	});
})();

		// modal handlers
		document.addEventListener('click', function(e){
			var modal = document.getElementById('resultModal');
			if(!modal) return;
			var target = e.target;
			if(target.matches('[data-action="close"]') || target.closest('.modal-close')){
				modal.classList.remove('show');
				modal.setAttribute('aria-hidden','true');
			}
			if(target.closest('.modal-print')){
				// open print view
				var content = modal.querySelector('.result-modal-content').innerHTML;
				var w = window.open('', '_blank');
				w.document.open();
				w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Print</title><link rel="stylesheet" href="style.css"></head><body>');
				w.document.write(content);
				w.document.write('</body></html>');
				w.document.close();
				w.focus();
				w.print();
			}
		});