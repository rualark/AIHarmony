<?
$site_dir = $_SERVER['SCRIPT_NAME'];
$site_dir = substr($site_dir, 0, strrpos($site_dir, "/"));
$site_folder = substr($site_dir, strrpos($site_dir, "/") + 1);
$domain_main = "artinfuser.com";
$url_root = "https://$domain_main";
$url_main = "$url_root/$site_folder";
$url_share = "$url_root/$site_folder";
$url_root_ai = "https://$domain_main/artinfuser";

$domain_mail = "artinfuser.com";

$docs_folder = "md";
$site_name = "Artinfuser Exercise";
$site_descr = "Edit and check music exercises";
$docs_menu_file = "_menu.txt";
$og_img = "og-counterpoint-600.jpg";
$favicon = "img/favicon-green.ico";

$company_name = "Artinfuser";
$company_email = "info@$domain_mail";
$country_name = "Russian Federation";

$mail_method = "sendmail";
$mail_params = array('sendmail_path' => 'c:\ospanel\modules\sendmail\sendmail.exe -t');

$ml = @mysqli_connect("localhost", "mgen", "Congress1");
if (!$ml) {
  die("<font color=red>Cannot connect to database. Please reload page</font>");
}
echo mysqli_connect_error();
mysqli_select_db($ml, "mgen");
mysqli_query($ml, "SET character_set_results = 'utf8', character_set_client = 'utf8', character_set_connection = 'utf8', character_set_database = 'utf8', character_set_server = 'utf8'");
echo mysqli_error($ml);
