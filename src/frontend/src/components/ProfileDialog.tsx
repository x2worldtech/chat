import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import type { User } from '../backend';
import { useUpdateProfilePicture, useUpdateBio } from '../hooks/useQueries';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';

interface ProfileDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({ user, open, onOpenChange }: ProfileDialogProps) {
  const [bio, setBio] = useState(user.bio || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile } = useFileUpload();
  const { data: profilePictureUrl } = useFileUrl(user.profilePicture || '');
  const updateProfilePicture = useUpdateProfilePicture();
  const updateBio = useUpdateBio();

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploadingImage(true);
    try {
      const path = `profile-pictures/${user.principal.toString()}-${Date.now()}.${file.name.split('.').pop()}`;
      const result = await uploadFile(path, file);
      await updateProfilePicture.mutateAsync(result.path);
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveBio = async () => {
    if (bio.trim() === user.bio) return;
    
    try {
      await updateBio.mutateAsync(bio.trim());
    } catch (error) {
      console.error('Failed to update bio:', error);
    }
  };

  const handleClose = () => {
    setBio(user.bio || '');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Customize your profile picture and biography
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                {profilePictureUrl && (
                  <AvatarImage src={profilePictureUrl} alt={user.username} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage || updateProfilePicture.isPending}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploadingImage || updateProfilePicture.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">
                {user.principal.toString().slice(0, 15)}...
              </p>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <span>Biography</span>
              <img 
                src="/assets/generated/edit-bio-icon.dim_16x16.png" 
                alt="" 
                className="h-3 w-3 opacity-70"
              />
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/150
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={updateBio.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBio}
              disabled={updateBio.isPending || bio.trim() === user.bio}
            >
              {updateBio.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
