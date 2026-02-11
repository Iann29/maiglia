"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { updateUser } from "@/lib/auth-client";
import { getCroppedImg } from "@/lib/cropImage";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function AvatarUploadModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AvatarUploadModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const finalizeUpload = useMutation(api.files.finalizeUpload);

  const resetState = useCallback(() => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsUploading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isUploading) return;
    resetState();
    onClose();
  }, [isUploading, resetState, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        onError("A imagem deve ter no máximo 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        onError("Selecione um arquivo de imagem");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);

      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [onError]
  );

  const handleSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);

      const { uploadUrl, uploadToken } = await generateUploadUrl();

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });

      if (!uploadRes.ok) {
        throw new Error("Falha no upload da imagem");
      }

      const { storageId } = await uploadRes.json();

      const result = await finalizeUpload({ uploadToken, storageId });

      if (!result.url) {
        throw new Error("Falha ao obter URL da imagem");
      }

      const url = result.url;

      const { error } = await updateUser({ image: url });
      if (error) {
        throw new Error(error.message ?? "Erro ao atualizar foto de perfil");
      }

      resetState();
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao enviar foto";
      onError(message);
    } finally {
      setIsUploading(false);
    }
  }, [
    imageSrc,
    croppedAreaPixels,
    generateUploadUrl,
    finalizeUpload,
    resetState,
    onSuccess,
    onError,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="avatar-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
          onClick={handleClose}
        >
          <motion.div
            key="avatar-modal-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Foto de Perfil"
            className="bg-bg-primary rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-fg-primary">
                Foto de Perfil
              </h2>
            </div>

            {/* Content */}
            <div className="px-6">
              {imageSrc ? (
                <div className="space-y-4">
                  {/* Crop area */}
                  <div className="relative w-full h-64 bg-bg-tertiary rounded-lg overflow-hidden">
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>

                  {/* Zoom slider */}
                  <div className="flex items-center gap-3">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-fg-muted shrink-0"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: "var(--accent)" }}
                      disabled={isUploading}
                    />
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-fg-muted shrink-0"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>

                  {/* Change image link */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-sm text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                  >
                    Trocar imagem
                  </button>
                </div>
              ) : (
                /* File selection area */
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border-primary hover:border-accent/50 bg-bg-secondary transition-colors cursor-pointer"
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-fg-muted"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  <span className="text-sm text-fg-secondary">
                    Selecionar imagem
                  </span>
                  <span className="text-xs text-fg-muted">
                    JPG, PNG ou WebP • Máximo 5MB
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 mt-2">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-fg-secondary hover:text-fg-primary transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              {imageSrc && (
                <button
                  onClick={handleSave}
                  disabled={isUploading || !croppedAreaPixels}
                  className="px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isUploading ? "Enviando..." : "Salvar"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
