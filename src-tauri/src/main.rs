// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Window;
#[tauri::command]
fn close_window(window: Window) {
    window.close().unwrap();
}
#[tauri::command]
fn min_window(window: Window) {
    window.minimize().unwrap();
}
#[tauri::command]
fn max_window(window: Window) {
    if window.is_maximized().unwrap() {
        window.unmaximize().unwrap();
    } else {
        window.maximize().unwrap();
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            close_window,
            min_window,
            max_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
